import { CompleteStarterTask } from './CompleteStarterTask';
import { CompleteItemTask } from './CompleteItemTask';
import { CompleteBalanceTask } from './CompleteBalanceTask';
import { DecodeTask96Buffer } from './Task96Buffer';
import { SaveAcceptedTask, SaveCompletedTask, SaveTaskBuffer } from './SaveTaskState';
import { TaskData } from '../../../DataBase/models/TaskData';
import { Logger } from '../../../shared/utils/Logger';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { PlayerInstance } from '../Player/PlayerInstance';
import { BaseManager } from '../Base/BaseManager';
import { TaskConfig, ITaskRewardItem } from '../../../shared/config/game/TaskConfig';
import { PacketCompleteTask } from '../../Server/Packet/Send/Task/PacketCompleteTask';
import { GameEventBus } from '../Event/GameEventBus';
import { BattleEventType, IBattleEndEvent, ItemEventType, IItemGainedEvent, PetEventType, IPetObtainedEvent, ItemGainSource, PetObtainSource } from '../Event/EventTypes';

/**
 * 任务管理器
 * 负责任务相关的业务逻辑
 * 
 * 架构：Manager 持有 TaskData，提供业务逻辑方法
 */
export class TaskManager extends BaseManager {
  /** 任务数据 */
  public TaskData!: TaskData;
  /** 同一在线玩家的相同任务只允许一个完成操作进入奖励阶段。 */
  private readonly completingTasks = new Set<number>();

  constructor(player: PlayerInstance) {
    super(player);
  }

  // ==================== 事件注册 ====================

  /**
   * 注册事件监听
   * - 战斗结束: 检查击杀类任务进度
   * - 物品获得: 检查收集类任务进度
   * - 精灵获得: 检查精灵收集类任务进度
   */
  public RegisterEvents(eventBus: GameEventBus): void {
    eventBus.On<IBattleEndEvent>(BattleEventType.BATTLE_END, this.OnBattleEnd.bind(this), 100);
    eventBus.On<IItemGainedEvent>(ItemEventType.ITEM_GAINED, this.OnItemGained.bind(this), 100);
    eventBus.On<IPetObtainedEvent>(PetEventType.PET_OBTAINED, this.OnPetObtained.bind(this), 100);
  }

  private OnBattleEnd(event: IBattleEndEvent): void {
    if (!event.isVictory) return;
    Logger.Debug(`[TaskManager] 战斗胜利事件: UserID=${this.UserID}, MapId=${event.mapId}, EnemyPetId=${event.enemyPetId}`);
    // 未来扩展：检查击杀类任务进度
  }

  private OnItemGained(event: IItemGainedEvent): void {
    Logger.Debug(`[TaskManager] 物品获得事件: UserID=${this.UserID}, ItemId=${event.itemId}, Count=${event.count}`);
    // 未来扩展：检查收集类任务进度
  }

  private OnPetObtained(event: IPetObtainedEvent): void {
    Logger.Debug(`[TaskManager] 精灵获得事件: UserID=${this.UserID}, PetId=${event.petId}, Level=${event.level}`);
    // 未来扩展：检查精灵收集类任务进度
  }

  /**
   * 初始化任务管理器
   */
  public async Initialize(): Promise<void> {
    // 通过 DatabaseHelper 加载或创建任务数据
    this.TaskData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_TaskData(this.UserID);
    Logger.Debug(`[TaskManager] 用户 ${this.UserID} 初始化完成`);
  }

  // ==================== 公开查询 API ====================

  /**
   * 获取任务状态数组（用于登录响应等）
   */
  public GetTaskStatusArray(): number[] {
    return this.TaskData.GetTaskStatusArray();
  }

  /**
   * 获取任务总数
   */
  public GetTaskCount(): number {
    return this.TaskData.TaskList.size;
  }

  /**
   * 检查任务是否已接受
   */
  public IsTaskAccepted(taskId: number): boolean {
    return this.TaskData.IsTaskAccepted(taskId);
  }

  /**
   * 接受任务（业务逻辑）
   */
  public async AcceptTask(taskId: number): Promise<void> {
    await SaveAcceptedTask(this.TaskData, taskId);
  }

  /**
   * 完成任务（业务逻辑）
   */
  public async CompleteTask(taskId: number, param: number): Promise<void> {
    if (this.completingTasks.has(taskId)) {
      await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5000));
      return;
    }
    // 在第一个 await 之前占用；持有至保存及响应结束。
    this.completingTasks.add(taskId);
    try {
      Logger.Info(`[TaskManager] 用户 ${this.UserID} 完成任务 ${taskId}，参数=${param}`);

      // 检查任务配置
      const taskConfig = TaskConfig.Instance.GetTask(taskId);
      if (!taskConfig) {
        Logger.Warn(`[TaskManager] 任务 ${taskId} 配置不存在`);
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5001));
        return;
      }

      // 检查任务状态
      if (!this.TaskData.IsTaskAccepted(taskId)) {
        Logger.Warn(`[TaskManager] 任务 ${taskId} 尚未接受`);
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5002));
        return;
      }

      if (this.TaskData.IsTaskCompleted(taskId)) {
        Logger.Warn(`[TaskManager] 任务 ${taskId} 已完成`);
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5003));
        return;
      }

      // 处理任务奖励
      let petId = 0;
      let captureTm = 0;
      const rewardItems: ITaskRewardItem[] = [];

      if (taskId === 88) {
        const rewards = taskConfig.rewards;
        const experience = rewards?.special?.find(item => item.type === 3);
        const gold = rewards?.special?.find(item => item.type === 5);
        if (param !== 1 || rewards?.coins === undefined || !experience || !gold ||
            rewards.special?.length !== 2 || Object.keys(rewards).some(key => !['coins', 'special'].includes(key))) {
          throw new Error('Unsupported task 88 reward request');
        }
        await CompleteBalanceTask(this.Player, taskId, {
          coins: rewards.coins, experience: experience.value, gold: gold.value
        });
        try {
          await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [
            { itemId: 1, count: rewards.coins },
            { itemId: 3, count: experience.value },
            { itemId: 5, count: gold.value }
          ]));
        } catch (error) {
          Logger.Error('[TaskManager] Task 88 reward committed; response delivery failed', error as Error);
        }
        return;
      }

      if (taskId === 96) {
        if (param !== 1 || taskConfig.rewards?.coins === undefined ||
            !taskConfig.rewards.special || Object.keys(taskConfig.rewards).some(k => !['coins', 'special'].includes(k)) ||
            taskConfig.rewards.special.length !== 1 || taskConfig.rewards.special[0].type !== 3) {
          throw new Error('Unsupported task 96 reward request');
        }
        await CompleteBalanceTask(this.Player, taskId, {
          coins: taskConfig.rewards.coins, experience: taskConfig.rewards.special[0].value
        });
        try {
          await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [
            { itemId: 1, count: taskConfig.rewards.coins },
            { itemId: 3, count: taskConfig.rewards.special[0].value }
          ]));
        } catch (error) {
          Logger.Error('[TaskManager] Balance reward committed; response delivery failed', error as Error);
        }
        return;
      }

      if (taskId === 85 || taskId === 87) {
        if (!taskConfig.rewards?.items || Object.keys(taskConfig.rewards).some(key => key !== 'items')) {
          throw new Error('Starter item task atomic reward only supports items');
        }
        await CompleteItemTask(this.TaskData, this.Player.ItemManager.ItemData, taskConfig.rewards.items, taskId);
        for (const item of taskConfig.rewards.items) {
          try {
            await this.Player.EventBus.Emit({ type: ItemEventType.ITEM_GAINED, timestamp: Date.now(),
              playerId: this.UserID, itemId: item.itemId, count: item.count, source: ItemGainSource.TASK_REWARD } as IItemGainedEvent);
          } catch (error) {
            Logger.Error('[TaskManager] Item reward committed; event delivery failed', error as Error);
          }
        }
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, taskConfig.rewards.items));
        return;
      }

      // Only structurally empty rewards use the state-only transaction.
      // Selection tasks can grant pets even when rewards is empty.
      if (taskId !== 86 && taskConfig.type !== 'select_pet' &&
          Object.keys(taskConfig.rewards ?? {}).length === 0) {
        await SaveCompletedTask(this.TaskData, taskId);
        await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, []));
        return;
      }

      // 1. 处理选择精灵任务
      if (taskConfig.type === 'select_pet' && taskConfig.paramMap) {
        const selectedPet = Object.prototype.hasOwnProperty.call(taskConfig.paramMap, param.toString())
          ? taskConfig.paramMap[param.toString()]
          : undefined;
        if (selectedPet === undefined) {
          await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5001));
          return;
        }
        petId = selectedPet;
        captureTm = Math.floor(Date.now() / 1000);

        if (taskId === 86) {
          // This atomic path is deliberately restricted to the configured single-pet reward.
          if (taskConfig.rewards && Object.keys(taskConfig.rewards).length !== 0) {
            throw new Error('Task 86 atomic reward does not support additional rewards');
          }
          await CompleteStarterTask(this.TaskData, this.Player.PetManager.PetData, petId, captureTm);
          this.Player.Data.petAllNum = this.Player.PetManager.PetData.PetList.length;
          this.Player.Data.petMaxLev = Math.max(...this.Player.PetManager.PetData.PetList.map(pet => pet.level));
          // The reward is already committed. Notification failure must not turn it into a retryable grant.
          try {
            await this.Player.EventBus.Emit({ type: PetEventType.PET_OBTAINED, timestamp: Date.now(),
              playerId: this.UserID, petId, level: 5, catchTime: captureTm, source: PetObtainSource.TASK_REWARD } as IPetObtainedEvent);
          } catch (error) {
            Logger.Error('[TaskManager] Starter reward committed; event delivery failed', error as Error);
          }
          await this.Player.SendPacket(new PacketCompleteTask(taskId, petId, captureTm, []));
          return;
        }

        // 给玩家精灵 - 新手精灵等级为5
        const granted = await this.Player.PetManager.GivePet(petId, 5, captureTm, PetObtainSource.TASK_REWARD);
        if (!granted) {
          await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5000));
          return;
        }
        Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 精灵 ${petId}, 等级5, catchTime=0x${captureTm.toString(16)}`);
      }

      // 2. 先处理精灵奖励，拒绝时不发放其他奖励或完成任务。
      if (taskConfig.rewards?.pets) {
        for (const pet of taskConfig.rewards.pets) {
          const catchTime = Math.floor(Date.now() / 1000);
          const granted = await this.Player.PetManager.GivePet(pet.petId, pet.level, catchTime, PetObtainSource.TASK_REWARD);
          if (!granted) {
            await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5000));
            return;
          }
          Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 精灵 ${pet.petId}, 等级${pet.level}`);
        }
      }

      // 3. 处理物品奖励
      if (taskConfig.rewards?.items) {
        for (const item of taskConfig.rewards.items) {
          await this.Player.ItemManager.GiveItem(item.itemId, item.count, ItemGainSource.TASK_REWARD);
          rewardItems.push({ itemId: item.itemId, count: item.count });
          Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 物品 ${item.itemId} x${item.count}`);
        }
      }

      // 4. 处理金币奖励
      if (taskConfig.rewards?.coins) {
        this.Player.Data.coins += taskConfig.rewards.coins;
        rewardItems.push({ itemId: 1, count: taskConfig.rewards.coins });
        Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 金币 ${taskConfig.rewards.coins}`);
      }

      // 5. 处理特殊奖励
      if (taskConfig.rewards?.special) {
        for (const special of taskConfig.rewards.special) {
          if (special.type === 1) {
            this.Player.Data.coins += special.value;
          } else if (special.type === 3) {
            // 经验值 - 暂不处理
          } else if (special.type === 5) {
            // 赛尔豆
            this.Player.Data.coins += special.value;
          }
          rewardItems.push({ itemId: special.type, count: special.value });
        }
      }

      // 6. 处理家具奖励（暂按物品处理）
      if (taskConfig.rewards?.fitments) {
        for (const fitment of taskConfig.rewards.fitments) {
          await this.Player.ItemManager.GiveItem(fitment.fitmentId, fitment.count, ItemGainSource.TASK_REWARD);
          Logger.Info(`[TaskManager] 给予用户 ${this.UserID} 家具 ${fitment.fitmentId} x${fitment.count}`);
        }
      }

      // 完成任务
      this.TaskData.CompleteTask(taskId);
      
      // 立即保存任务数据到数据库
      await DatabaseHelper.Instance.SaveTaskData(this.TaskData);

      // 发送响应
      await this.Player.SendPacket(new PacketCompleteTask(taskId, petId, captureTm, rewardItems));
      Logger.Info(`[TaskManager] 用户 ${this.UserID} 完成任务 ${taskId} 成功 - petId=${petId}, captureTm=${captureTm}, rewardItems=${rewardItems.length}个`);
      
      // 详细记录奖励内容
      if (rewardItems.length > 0) {
        Logger.Info(`[TaskManager] 奖励详情: ${JSON.stringify(rewardItems)}`);
      }
    } catch (error) {
      Logger.Error(`[TaskManager] 完成任务失败: taskId=${taskId}`, error as Error);
      await this.Player.SendPacket(new PacketCompleteTask(taskId, 0, 0, [], 5000));
    } finally {
      this.completingTasks.delete(taskId);
    }
  }

  /**
   * 设置任务缓存值（业务逻辑）
   */
  public async SetTaskBufferValue(taskId: number, index: number, value: number): Promise<void> {
    await SaveTaskBuffer(this.TaskData, taskId, current => ({
      ...(current ?? { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }), [index]: value
    }));
  }

  /** 保存旧 Nieo 任务进度的逐字节值，不将布尔进度解释为 UInt32。 */
  public async SetTaskProgressBytes(taskId: number, bytes: Buffer): Promise<void> {
    await SaveTaskBuffer(this.TaskData, taskId, current => ({ ...current, ...Array.from(bytes) }));
  }

  /** 保存 XIN 2204 请求中的完整任务缓存区。 */
  public async SetTaskBufferBytes(taskId: number, bytes: Buffer): Promise<void> {
    const xinBytes = Array.from(bytes);
    await SaveTaskBuffer(this.TaskData, taskId, current => ({ ...current, xinBytes }));
  }

  /**
   * 获取任务缓存（只读，不需要标记保存）
   */
  public GetTaskBuffer(taskId: number): number[] {
    const buffer = this.TaskData.GetTaskBuffer(taskId);
    if (taskId === 96) return DecodeTask96Buffer(buffer);
    return [
      buffer[0] || 0,
      buffer[1] || 0,
      buffer[2] || 0,
      buffer[3] || 0,
      buffer[4] || 0
    ];
  }

  /** 读取 XIN 2203 响应所需的原始任务缓存区。 */
  public GetTaskBufferBytes(taskId: number, length: number): Buffer {
    return this.TaskData.GetTaskBufferBytes(taskId, length);
  }
}
