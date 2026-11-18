"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskManager = void 0;
const CompleteConfiguredTask_1 = require("./CompleteConfiguredTask");
const Task96Buffer_1 = require("./Task96Buffer");
const SaveTaskState_1 = require("./SaveTaskState");
const Logger_1 = require("../../../shared/utils/Logger");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const BaseManager_1 = require("../Base/BaseManager");
const TaskConfig_1 = require("../../../shared/config/game/TaskConfig");
const PacketCompleteTask_1 = require("../../Server/Packet/Send/Task/PacketCompleteTask");
const EventTypes_1 = require("../Event/EventTypes");
const CommandID_1 = require("../../../shared/protocol/CommandID");
/**
 * 任务管理器
 * 负责任务相关的业务逻辑
 *
 * 架构：Manager 持有 TaskData，提供业务逻辑方法
 */
class TaskManager extends BaseManager_1.BaseManager {
    /** 任务数据 */
    TaskData;
    /** 同一在线玩家的相同任务只允许一个完成操作进入奖励阶段。 */
    completingTasks = new Set();
    constructor(player) {
        super(player);
    }
    // ==================== 事件注册 ====================
    /**
     * 注册事件监听
     * - 战斗结束: 检查击杀类任务进度
     * - 物品获得: 检查收集类任务进度
     * - 精灵获得: 检查精灵收集类任务进度
     */
    RegisterEvents(eventBus) {
        eventBus.On(EventTypes_1.BattleEventType.BATTLE_END, this.OnBattleEnd.bind(this), 100);
        eventBus.On(EventTypes_1.ItemEventType.ITEM_GAINED, this.OnItemGained.bind(this), 100);
        eventBus.On(EventTypes_1.PetEventType.PET_OBTAINED, this.OnPetObtained.bind(this), 100);
    }
    OnBattleEnd(event) {
        if (!event.isVictory)
            return;
        Logger_1.Logger.Debug(`[TaskManager] 战斗胜利事件: UserID=${this.UserID}, MapId=${event.mapId}, EnemyPetId=${event.enemyPetId}`);
        // 未来扩展：检查击杀类任务进度
    }
    OnItemGained(event) {
        Logger_1.Logger.Debug(`[TaskManager] 物品获得事件: UserID=${this.UserID}, ItemId=${event.itemId}, Count=${event.count}`);
        // 未来扩展：检查收集类任务进度
    }
    OnPetObtained(event) {
        Logger_1.Logger.Debug(`[TaskManager] 精灵获得事件: UserID=${this.UserID}, PetId=${event.petId}, Level=${event.level}`);
        // 未来扩展：检查精灵收集类任务进度
    }
    /**
     * 初始化任务管理器
     */
    async Initialize() {
        // 通过 DatabaseHelper 加载或创建任务数据
        this.TaskData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_TaskData(this.UserID);
        for (const taskId of TaskConfig_1.TaskConfig.Instance.GetAllTaskIds()) {
            const config = TaskConfig_1.TaskConfig.Instance.GetTask(taskId);
            if (config?.type === 'daily' &&
                (this.TaskData.TaskList.has(taskId) || this.TaskData.TaskBuffers.has(taskId))) {
                await (0, SaveTaskState_1.EnsureDailyTaskDay)(this.TaskData, taskId, this.GetDailyDay());
            }
        }
        await require("./MoonlightEssenceReward").ReconcileMoonlightEssence(this.Player);
        Logger_1.Logger.Debug(`[TaskManager] 用户 ${this.UserID} 初始化完成`);
    }
    // ==================== 公开查询 API ====================
    /**
     * 获取任务状态数组（用于登录响应等）
     */
    GetTaskStatusArray() {
        return this.TaskData.GetTaskStatusArray();
    }
    /**
     * 获取任务总数
     */
    GetTaskCount() {
        return this.TaskData.TaskList.size;
    }
    /**
     * 检查任务是否已接受
     */
    IsTaskAccepted(taskId) {
        return this.TaskData.IsTaskAccepted(taskId);
    }
    /**
     * 接受任务（业务逻辑）
     */
    async AcceptTask(taskId) {
        const config = TaskConfig_1.TaskConfig.Instance.GetTask(taskId);
        if (!config || config.type === 'daily' || config.type === 'client_only')
            throw new Error('Task cannot be accepted');
        if (config.parentTaskId && !this.TaskData.IsTaskCompleted(config.parentTaskId))
            throw new Error('Previous story quest is not complete');
        await (0, SaveTaskState_1.SaveAcceptedTask)(this.TaskData, taskId);
    }
    GetDailyDay(now = Date.now()) {
        return Math.floor((Math.floor(now / 1000) + 8 * 60 * 60) / (24 * 60 * 60));
    }
    async EnsureDailyTaskDay(taskId) {
        const config = TaskConfig_1.TaskConfig.Instance.GetTask(taskId);
        if (!config || config.type !== 'daily')
            throw new Error('Unknown daily task');
        const day = this.GetDailyDay();
        await (0, SaveTaskState_1.EnsureDailyTaskDay)(this.TaskData, taskId, day);
        return day;
    }
    async AcceptDailyTask(taskId) {
        const config = TaskConfig_1.TaskConfig.Instance.GetTask(taskId);
        if (!config || config.type !== 'daily')
            throw new Error('Unknown daily task');
        await (0, SaveTaskState_1.SaveAcceptedDailyTask)(this.TaskData, taskId, this.GetDailyDay());
    }
    async DeleteDailyTask(taskId) {
        const config = TaskConfig_1.TaskConfig.Instance.GetTask(taskId);
        if (!config || config.type !== 'daily')
            throw new Error('Unknown daily task');
        await (0, SaveTaskState_1.DeleteDailyTask)(this.TaskData, taskId, this.GetDailyDay());
    }
    /**
     * 完成任务（业务逻辑）
     */
    async CompleteTask(taskId, param, daily = false) {
        const commandId = daily ? CommandID_1.CommandID.COMPLETE_DAILY_TASK : CommandID_1.CommandID.COMPLETE_TASK;
        if (this.completingTasks.has(taskId)) {
            await this.Player.SendPacket(new PacketCompleteTask_1.PacketCompleteTask(taskId, 0, 0, [], 5000, commandId));
            return;
        }
        this.completingTasks.add(taskId);
        let committed = false;
        try {
            const taskConfig = TaskConfig_1.TaskConfig.Instance.GetTask(taskId);
            if (!taskConfig || taskConfig.type === 'client_only' ||
                (daily ? taskConfig.type !== 'daily' : taskConfig.type === 'daily')) {
                await this.Player.SendPacket(new PacketCompleteTask_1.PacketCompleteTask(taskId, 0, 0, [], 5001, commandId));
                return;
            }
            const dailyDay = daily ? await this.EnsureDailyTaskDay(taskId) : undefined;
            if (!this.TaskData.IsTaskAccepted(taskId)) {
                await this.Player.SendPacket(new PacketCompleteTask_1.PacketCompleteTask(taskId, 0, 0, [], 5002, commandId));
                return;
            }
            if (this.TaskData.IsTaskCompleted(taskId)) {
                await this.Player.SendPacket(new PacketCompleteTask_1.PacketCompleteTask(taskId, 0, 0, [], 5003, commandId));
                return;
            }
            const reward = await (0, CompleteConfiguredTask_1.CompleteConfiguredTask)(this.Player, taskId, param, taskConfig, dailyDay);
            committed = true;
            const inventoryIds = new Set([
                ...(taskConfig.rewards?.items ?? []).map(item => item.itemId),
                ...(taskConfig.rewards?.fitments ?? []).map(item => item.fitmentId),
            ]);
            for (const item of reward.items.filter(item => inventoryIds.has(item.itemId))) {
                try {
                    await this.Player.EventBus.Emit({
                        type: EventTypes_1.ItemEventType.ITEM_GAINED, timestamp: Date.now(), playerId: this.UserID,
                        itemId: item.itemId, count: item.count, source: EventTypes_1.ItemGainSource.TASK_REWARD,
                    });
                }
                catch (error) {
                    Logger_1.Logger.Error('[TaskManager] Item reward committed; event delivery failed', error);
                }
            }
            for (const pet of reward.pets) {
                try {
                    await this.Player.EventBus.Emit({
                        type: EventTypes_1.PetEventType.PET_OBTAINED, timestamp: Date.now(), playerId: this.UserID,
                        petId: pet.petId, level: pet.level, catchTime: pet.catchTime, source: EventTypes_1.PetObtainSource.TASK_REWARD,
                    });
                }
                catch (error) {
                    Logger_1.Logger.Error('[TaskManager] Pet reward committed; event delivery failed', error);
                }
            }
            try {
                await this.Player.SendPacket(new PacketCompleteTask_1.PacketCompleteTask(taskId, reward.petId, reward.captureTm, reward.items, 0, commandId));
            }
            catch (error) {
                Logger_1.Logger.Error('[TaskManager] Task reward committed; response delivery failed', error);
            }
        }
        catch (error) {
            Logger_1.Logger.Error(`[TaskManager] 完成任务失败: taskId=${taskId}`, error);
            if (!committed)
                await this.Player.SendPacket(new PacketCompleteTask_1.PacketCompleteTask(taskId, 0, 0, [], 5000, commandId));
        }
        finally {
            this.completingTasks.delete(taskId);
        }
    }
    /**
     * 设置任务缓存值（业务逻辑）
     */
    async SetTaskBufferValue(taskId, index, value) {
        await (0, SaveTaskState_1.SaveTaskBuffer)(this.TaskData, taskId, current => ({
            ...(current ?? { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }), [index]: value
        }));
    }
    /** 保存旧 Nieo 任务进度的逐字节值，不将布尔进度解释为 UInt32。 */
    async SetTaskProgressBytes(taskId, bytes) {
        await (0, SaveTaskState_1.SaveTaskBuffer)(this.TaskData, taskId, current => ({ ...current, ...Array.from(bytes) }));
    }
    /** 保存 XIN 2204 请求中的完整任务缓存区。 */
    async SetTaskBufferBytes(taskId, bytes) {
        const xinBytes = Array.from(bytes);
        await (0, SaveTaskState_1.SaveTaskBuffer)(this.TaskData, taskId, current => ({ ...current, xinBytes }));
    }
    /**
     * 获取任务缓存（只读，不需要标记保存）
     */
    GetTaskBuffer(taskId) {
        return (0, Task96Buffer_1.DecodeTask96Buffer)(this.TaskData.GetTaskBuffer(taskId));
    }
    /** 读取 XIN 2203 响应所需的原始任务缓存区。 */
    GetTaskBufferBytes(taskId, length) {
        return this.TaskData.GetTaskBufferBytes(taskId, length);
    }
}
exports.TaskManager = TaskManager;
//# sourceMappingURL=TaskManager.js.map