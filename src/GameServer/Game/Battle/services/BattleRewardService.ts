import { Logger } from '../../../../shared/utils';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { IBattleInfo } from '../../../../shared/models/BattleModel';
import { GameConfig } from '../../../../shared/config/game/GameConfig';
import { BossAbilityConfig } from '../BossAbility/BossAbilityConfig';
import { BossSpecialRules } from '../BossSpecialRules';
import { ItemGainSource, PetObtainSource } from '../../Event/EventTypes';
import { GetRewardBoostStatus } from '../../Reward/RewardBoost';

export interface VictoryRewardResult {
  status: 'complete' | 'partial' | 'failed';
  failedStage?: 'experience' | 'coins' | 'items' | 'spt';
  expGained: number;
  coinsGained: number;
  levelUp: boolean;
  newLevel: number;
  droppedItems: { itemId: number; count: number }[];
  rewardItems: Array<{ itemId: number; itemCnt: number }>;
}

/**
 * 战斗奖励服务
 * 负责处理战斗胜利后的奖励：经验、金币、捕获等
 */
export class BattleRewardService {
  private _player: PlayerInstance;
  private readonly pendingSPTRewards = new Set<number>();

  constructor(player: PlayerInstance) {
    this._player = player;
  }

  /**
   * 处理战斗胜利奖励
   * @param userId 玩家ID
   * @param battle 战斗信息
   * @param mapId 地图ID（可选，用于读取配置）
   * @param slot 野怪槽位（可选，用于读取配置）
   * @param originalPetId 原始精灵ID（可选，用于查找配置，闪光精灵需要用原始ID查找）
   */
  public async ProcessVictoryReward(
    userId: number, 
    battle: IBattleInfo,
    mapId?: number,
    slot?: number,
    originalPetId?: number
  ): Promise<VictoryRewardResult> {
    const result: VictoryRewardResult = {
      status: 'complete', expGained: 0, coinsGained: 0, levelUp: false,
      newLevel: battle.player.level, droppedItems: [], rewardItems: []
    };
    let stage: NonNullable<VictoryRewardResult['failedStage']> = 'experience';
    let sptRewards: { itemId: number; count: number }[] = [];
    try {
      // Snapshot all three effects at settlement time; later awaits do not change this battle's rates.
      const boosts = await GetRewardBoostStatus(userId);
      const expGained = this.CalculateExpReward(battle.enemy.level, battle.enemy.id, mapId, slot) * boosts.experience.multiplier;
      const coinsGained = this.CalculateCoinsReward(battle.enemy.level) * boosts.coins.multiplier;

      // 3. 给精灵增加经验（使用catchTime查找精灵）
      const catchTime = battle.player.catchTime;
      if (!this._player.PetManager.GetPetByCatchTime(catchTime)) throw new Error('Reward pet missing');
      // PetManager commits its detached candidate before publishing or notifying.
      result.levelUp = await this._player.PetManager.HandleAddPetExpByCatchTime(catchTime, expGained, battle.enemy.id, {
        learningMultiplier: boosts.learning.multiplier,
        storedExperience: boosts.experience.multiplier > 1 ? expGained : 0
      });
      const rewardedPet = this._player.PetManager.GetPetByCatchTime(catchTime);
      if (!rewardedPet) throw new Error('Reward pet disappeared');
      result.expGained = expGained;
      result.newLevel = rewardedPet.level;

      // 4. 给玩家增加金币
      stage = 'coins';
      if (coinsGained > 0 && !await this._player.AddCurrency(undefined, coinsGained)) {
        throw new Error('Currency reward was not persisted');
      }
      result.coinsGained = coinsGained;

      // 5. 处理掉落物品（使用originalPetId查找配置，如果没有则使用当前petId）
      stage = 'items';
      const droppedItems = this.ProcessDropItems(mapId, slot, originalPetId || battle.enemy.id);
      for (const drop of droppedItems) {
        if (!await this._player.ItemManager.GiveItem(drop.itemId, drop.count, ItemGainSource.DROP)) {
          throw new Error(`Drop reward was not persisted: ${drop.itemId}`);
        }
        result.droppedItems.push(drop);
        Logger.Info(`[BattleRewardService] 掉落物品已添加到背包: ItemId=${drop.itemId}, Count=${drop.count}`);
      }

      // 6. 处理SPT首次击败奖励（如果是BOSS战斗）
      stage = 'spt';
      sptRewards = await this.ProcessSPTFirstDefeatReward(battle, mapId);
    } catch (error) {
      Logger.Error(`[BattleRewardService] 处理奖励失败: ${error}`);
      result.failedStage = stage;
      result.status = result.expGained || result.coinsGained || result.droppedItems.length ? 'partial' : 'failed';
    }
    // Never erase committed components or announce a calculated-but-uncommitted reward.
    if (result.coinsGained > 0) result.rewardItems.push({ itemId: 1, itemCnt: result.coinsGained });
    for (const drop of [...result.droppedItems, ...sptRewards]) result.rewardItems.push({ itemId: drop.itemId, itemCnt: drop.count });
    Logger.Info(`[BattleRewardService] 战斗奖励: UserID=${userId}, Status=${result.status}, Stage=${result.failedStage || '-'}, Exp=${result.expGained}, Coins=${result.coinsGained}`);
    return result;
  }

  /**
   * 处理SPT首次击败奖励
   * @param battle 战斗信息
   * @param mapId 地图ID（用于周几规则验证）
   * @returns 奖励物品列表
   */
  private async ProcessSPTFirstDefeatReward(
    battle: IBattleInfo,
    mapId?: number
  ): Promise<{ itemId: number; count: number }[]> {
    const rewards: { itemId: number; count: number }[] = [];

    // 检查是否是BOSS战斗
    if (battle.bossMapId === undefined || battle.bossParam2 === undefined) {
      return rewards;
    }

    // 获取BOSS配置
    const bossConfig = BossAbilityConfig.Instance.GetBossConfigByMapAndParam(battle.bossMapId, battle.bossParam2);
    if (!bossConfig || !bossConfig.spt) {
      return rewards;
    }

    const sptInfo = bossConfig.spt;

    // 检查是否是SPT BOSS
    if (!sptInfo.sptId || sptInfo.sptId <= 0 || sptInfo.sptId > 200) {
      return rewards;
    }

    // 检查玩家是否已经击败过这个SPT BOSS（通过 ChallengeProgressManager）
    if (this._player.ChallengeProgressManager.HasDefeatedSPTBoss(sptInfo.sptId)) {
      Logger.Info(`[BattleRewardService] SPT BOSS已击败过，不发放首次奖励: MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, SPTId=${sptInfo.sptId}`);
      return rewards;
    }

    // 验证周几出现规则（如果适用）
    if (mapId !== undefined && BossAbilityConfig.Instance.IsWeekdayScheduleBoss(battle.enemy.id)) {
      const roundCount = battle.roundCount || 0;
      const isCriticalHit = battle.lastHitWasCritical || false;

      const validation = BossSpecialRules.ValidateWeekdayScheduleCondition(
        battle.enemy.id,
        mapId,
        roundCount,
        isCriticalHit
      );

      if (!validation.valid) {
        Logger.Warn(
          `[BattleRewardService] 周几规则验证失败，不发放首次奖励: ` +
          `MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, 条件=${validation.conditionDesc}`
        );
        return rewards;
      }

      Logger.Info(
        `[BattleRewardService] 周几规则验证通过: ` +
        `MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, 条件=${validation.conditionDesc}`
      );
    }

    // 在首次 await 前占用同实例的首胜发奖；失败后允许下一次显式挑战。
    if (this.pendingSPTRewards.has(sptInfo.sptId)) return rewards;
    this.pendingSPTRewards.add(sptInfo.sptId);
    try {
      if (sptInfo.rewardPetId && sptInfo.rewardPetId > 0) {
        const catchTime = Math.floor(Date.now() / 1000);
        const success = await this._player.PetManager.GivePet(sptInfo.rewardPetId, 1, catchTime, PetObtainSource.BATTLE_REWARD);
        if (!success) {
          Logger.Warn(`[BattleRewardService] SPT发宠拒绝，保留首胜资格: SPTId=${sptInfo.sptId}`);
          throw new Error('SPT pet reward was rejected');
        }
        Logger.Info(`[BattleRewardService] SPT奖励精灵已发放: PetId=${sptInfo.rewardPetId}`);
      }

      this._player.ChallengeProgressManager.MarkSPTBossDefeated(sptInfo.sptId);
      Logger.Info(`[BattleRewardService] SPT BOSS首次击败: MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, SPTId=${sptInfo.sptId}, PetName=${bossConfig.petName}`);

      if (sptInfo.rewardItemId && sptInfo.rewardItemId > 0) {
        if (!await this._player.ItemManager.GiveItem(sptInfo.rewardItemId, 1, ItemGainSource.DROP)) {
          throw new Error('SPT item reward was not persisted');
        }
        rewards.push({ itemId: sptInfo.rewardItemId, count: 1 });
        Logger.Info(`[BattleRewardService] SPT奖励物品已发放: ItemId=${sptInfo.rewardItemId}`);
      }
      return rewards;
    } finally {
      this.pendingSPTRewards.delete(sptInfo.sptId);
    }
  }

  /**
   * 处理精灵捕获
   * @param userId 玩家ID
   * @param battle 战斗信息
   * @param catchTime 捕获时间
   * @param mapId 地图ID（可选，用于检查是否可捕获）
   * @param slot 野怪槽位（可选，用于检查是否可捕获）
   */
  public async ProcessCatch(
    userId: number, 
    battle: IBattleInfo, 
    catchTime: number,
    mapId?: number,
    slot?: number
  ): Promise<boolean> {
    try {
      // 检查是否可以捕获（从配置读取）
      const catchable = this.IsCatchable(battle.enemy.id, mapId, slot);
      if (!catchable) {
        Logger.Warn(`[BattleRewardService] 该精灵不可捕获: PetId=${battle.enemy.id}`);
        return false;
      }

      // GivePet owns bag capacity and sends overflow pets to storage.
      const success = await this._player.PetManager.GivePet(battle.enemy.id, battle.enemy.level, catchTime, PetObtainSource.CATCH);

      if (success) {
        Logger.Info(`[BattleRewardService] 捕获精灵: UserID=${userId}, PetId=${battle.enemy.id}, Level=${battle.enemy.level}, CatchTime=${catchTime}`);
        
        // 捕获成功后，客户端会自动处理精灵列表刷新（通过 CATCH_SUCCESS 事件）
        // 无需服务器主动推送
      }

      return success;

    } catch (error) {
      Logger.Error(`[BattleRewardService] 捕获精灵失败: ${error}`);
      return false;
    }
  }

  /**
   * 计算经验奖励
   * 优先从配置读取，否则使用默认计算
   */
  private CalculateExpReward(enemyLevel: number, enemyId: number, mapId?: number, slot?: number): number {
    // 尝试从配置读取
    if (mapId !== undefined && slot !== undefined) {
      const ogreConfig = this.GetOgreConfig(mapId, slot, enemyId);
      if (ogreConfig) {
        // 如果配置了经验奖励，使用配置值
        if (ogreConfig.expReward !== undefined) {
          const multiplier = ogreConfig.expMultiplier || 1.0;
          return Math.floor(ogreConfig.expReward * multiplier);
        }
      }
    }

    // 尝试从精灵配置读取 YieldingExp
    const petConfig = GameConfig.GetPetById(enemyId);
    if (petConfig && petConfig.YieldingExp) {
      return petConfig.YieldingExp;
    }

    // 默认计算：基础经验 = 敌人等级 * 10
    const baseExp = enemyLevel * 10;

    // BOSS额外奖励
    const bossBonus = enemyId > 100 ? 1.5 : 1.0;

    return Math.floor(baseExp * bossBonus);
  }

  /**
   * 计算金币奖励
   */
  private CalculateCoinsReward(enemyLevel: number): number {
    // 金币 = 敌人等级 * 5
    return enemyLevel * 5;
  }

  /**
   * 处理掉落物品
   */
  private ProcessDropItems(mapId?: number, slot?: number, petId?: number): { itemId: number; count: number }[] {
    if (mapId === undefined || petId === undefined) {
      Logger.Debug(`[BattleRewardService] 无法处理掉落: mapId=${mapId}, petId=${petId}`);
      return [];
    }

    const droppedItems: { itemId: number; count: number }[] = [];

    // 从配置读取掉落物品
    const mapConfig = GameConfig.GetMapOgreConfig();
    if (!mapConfig) {
      Logger.Debug(`[BattleRewardService] 地图配置未加载`);
      return droppedItems;
    }

    const map = mapConfig.maps[mapId.toString()];
    if (!map) {
      Logger.Debug(`[BattleRewardService] 地图${mapId}配置不存在`);
      return droppedItems;
    }

    // 使用petId查找配置（而不是slot，因为同一地图可能有多个不同精灵）
    const ogre = map.ogres.find(o => o.petId === petId);
    if (!ogre) {
      Logger.Debug(`[BattleRewardService] 地图${mapId}精灵${petId}配置不存在`);
      return droppedItems;
    }
    
    if (!ogre.dropItems || ogre.dropItems.length === 0) {
      Logger.Debug(`[BattleRewardService] 地图${mapId}精灵${petId}没有配置掉落物品`);
      return droppedItems;
    }

    Logger.Debug(`[BattleRewardService] 处理掉落: mapId=${mapId}, petId=${petId}, slot=${slot}, dropConfigs=${ogre.dropItems.length}`);

    // 处理每个掉落物品
    for (const dropConfig of ogre.dropItems) {
      const roll = Math.random();
      Logger.Debug(`[BattleRewardService] 掉落判定: itemId=${dropConfig.itemId}, rate=${dropConfig.dropRate}, roll=${roll.toFixed(3)}`);
      
      // 掉落概率判定
      if (roll <= dropConfig.dropRate) {
        // 随机掉落数量
        const count = Math.floor(
          Math.random() * (dropConfig.maxCount - dropConfig.minCount + 1) + dropConfig.minCount
        );
        droppedItems.push({ itemId: dropConfig.itemId, count });
        Logger.Info(`[BattleRewardService] 掉落成功: itemId=${dropConfig.itemId}, count=${count}`);
      } else {
        Logger.Debug(`[BattleRewardService] 掉落失败: itemId=${dropConfig.itemId}`);
      }
    }

    return droppedItems;
  }

  /**
   * 检查精灵是否可以捕获
   */
  public IsCatchable(petId: number, mapId?: number, slot?: number): boolean {
    // 尝试从配置读取
    if (mapId !== undefined && slot !== undefined) {
      const ogreConfig = this.GetOgreConfig(mapId, slot, petId);
      if (ogreConfig) {
        // 如果配置了 catchable，使用配置值
        if (ogreConfig.catchable !== undefined) {
          return ogreConfig.catchable;
        }
      }
    }

    // 默认可以捕获
    return true;
  }

  /**
   * 获取野怪配置
   */
  private GetOgreConfig(mapId: number, slot: number, petId: number) {
    const mapConfig = GameConfig.GetMapOgreConfig();
    if (!mapConfig) return null;

    const map = mapConfig.maps[mapId.toString()];
    if (!map) return null;

    // 优先使用petId查找，如果找不到再用slot查找
    return map.ogres.find(o => o.petId === petId) || map.ogres.find(o => o.slot === slot);
  }
}
