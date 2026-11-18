"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameEventBus = void 0;
const EventDispatcher_1 = require("./EventDispatcher");
/**
 * 玩家事件总线
 *
 * 每个 PlayerInstance 持有一个 GameEventBus 实例。
 * 所有域（战斗、任务、物品、精灵等）的事件流经同一个 Dispatcher，
 * 事件类型字符串（如 "battle:end"、"item:gained"）本身已包含域前缀，
 * 无需按命名空间拆分 Dispatcher。
 *
 * 架构要点：
 * - 事件发射方（Manager）调用 Emit / EmitSync 发出事件
 * - 事件监听方（其他 Manager）通过 On 注册处理器
 * - 各 Manager 在自己的 RegisterEvents() 中注册，实现完全解耦
 * - 全局事件（跨玩家）使用 GameEventBus.Global
 */
class GameEventBus {
    _dispatcher = new EventDispatcher_1.EventDispatcher();
    /** 全局事件调度器（跨玩家共享，如每日重置、活动开启） */
    static _globalDispatcher = new EventDispatcher_1.EventDispatcher();
    // ==================== 注册 ====================
    /**
     * 注册事件处理器
     * @param type 事件类型（如 BattleEventType.BATTLE_END）
     * @param fn 处理函数
     * @param priority 优先级，数值越小越先执行（默认 100）
     */
    On(type, fn, priority = 100) {
        this._dispatcher.Register(type, fn, priority);
    }
    /**
     * 注册一次性事件处理器（执行后自动移除）
     */
    Once(type, fn, priority = 100) {
        this._dispatcher.RegisterOnce(type, fn, priority);
    }
    /**
     * 移除事件处理器
     * @param type 事件类型
     * @param fn 具体处理函数（不传则移除该类型所有处理器）
     */
    Off(type, fn) {
        this._dispatcher.Unregister(type, fn);
    }
    // ==================== 派发 ====================
    /**
     * 异步派发事件（各处理器按优先级依次执行）
     * 适用于：奖励发放、成就检查、任务进度等不阻塞主流程的场景
     */
    async Emit(event) {
        await this._dispatcher.Dispatch(event);
    }
    /**
     * 同步派发事件（立即执行，不等待异步）
     * 适用于：属性修改、Buff 施加、HP 变化等需立即生效的场景
     */
    EmitSync(event) {
        this._dispatcher.DispatchSync(event);
    }
    // ==================== 全局事件 ====================
    /**
     * 获取全局事件调度器
     * 用于不绑定特定玩家的事件（每日重置、活动开启等）
     */
    static get Global() {
        return GameEventBus._globalDispatcher;
    }
    /**
     * 清空全局事件处理器
     */
    static ClearGlobal() {
        GameEventBus._globalDispatcher.Clear();
    }
    // ==================== 生命周期 ====================
    /**
     * 销毁事件总线（玩家登出时调用）
     */
    Destroy() {
        this._dispatcher.Clear();
    }
    // ==================== 调试 ====================
    /**
     * 获取指定事件类型的处理器数量
     */
    GetHandlerCount(type) {
        return this._dispatcher.GetHandlerCount(type);
    }
    /**
     * 获取所有已注册的事件类型
     */
    GetRegisteredTypes() {
        return this._dispatcher.GetRegisteredTypes();
    }
}
exports.GameEventBus = GameEventBus;
//# sourceMappingURL=GameEventBus.js.map