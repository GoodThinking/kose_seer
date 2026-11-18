"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDispatcher = void 0;
const utils_1 = require("../../../shared/utils");
class EventDispatcher {
    _handlers = new Map();
    _functions = [];
    _onceHandlers = new Map();
    /**
     * 注册事件处理器（持久）
     */
    Register(type, fn, priority = 100) {
        this._functions.push({ type, fn, priority });
        this._functions.sort((a, b) => a.priority - b.priority);
    }
    /**
     * 注册一次性处理器（执行后自动移除）
     */
    RegisterOnce(type, fn, priority = 100) {
        const list = this._onceHandlers.get(type) || [];
        list.push({ fn, priority });
        list.sort((a, b) => a.priority - b.priority);
        this._onceHandlers.set(type, list);
    }
    /**
     * 注册类处理器
     */
    RegisterHandler(handler) {
        const list = this._handlers.get(handler.eventType) || [];
        list.push(handler);
        list.sort((a, b) => a.priority - b.priority);
        this._handlers.set(handler.eventType, list);
    }
    /**
     * 移除指定类型的处理器
     */
    Unregister(type, fn) {
        if (fn) {
            this._functions = this._functions.filter(f => !(f.type === type && f.fn === fn));
        }
        else {
            this._functions = this._functions.filter(f => f.type !== type);
            this._handlers.delete(type);
            this._onceHandlers.delete(type);
        }
    }
    /**
     * 派发事件
     */
    async Dispatch(event) {
        // 1. 类处理器
        const handlers = this._handlers.get(event.type) || [];
        for (const h of handlers) {
            try {
                await h.handle(event);
            }
            catch (error) {
                utils_1.Logger.Error(`[EventDispatcher] Handler ${h.constructor.name} error`, error);
            }
        }
        // 2. 持久函数处理器
        const fns = this._functions.filter(f => f.type === event.type);
        for (const { fn } of fns) {
            try {
                await fn(event);
            }
            catch (error) {
                utils_1.Logger.Error(`[EventDispatcher] Handler fn error`, error);
            }
        }
        // 3. 一次性处理器（执行后移除）
        const onceFns = this._onceHandlers.get(event.type) || [];
        this._onceHandlers.delete(event.type);
        for (const { fn } of onceFns) {
            try {
                await fn(event);
            }
            catch (error) {
                utils_1.Logger.Error(`[EventDispatcher] Once handler fn error`, error);
            }
        }
    }
    /**
     * 同步派发（用于需要立即生效的场景）
     */
    DispatchSync(event) {
        const handlers = this._handlers.get(event.type) || [];
        for (const h of handlers) {
            try {
                h.handle(event);
            }
            catch (error) {
                utils_1.Logger.Error(`[EventDispatcher] Sync handler error`, error);
            }
        }
        const fns = this._functions.filter(f => f.type === event.type);
        for (const { fn } of fns) {
            try {
                fn(event);
            }
            catch (error) {
                utils_1.Logger.Error(`[EventDispatcher] Sync fn error`, error);
            }
        }
    }
    /**
     * 清空所有处理器
     */
    Clear() {
        this._handlers.clear();
        this._functions = [];
        this._onceHandlers.clear();
    }
    /**
     * 获取处理器数量
     */
    GetHandlerCount(type) {
        const classCount = (this._handlers.get(type) || []).length;
        const fnCount = this._functions.filter(f => f.type === type).length;
        const onceCount = (this._onceHandlers.get(type) || []).length;
        return classCount + fnCount + onceCount;
    }
    /**
     * 获取所有已注册的事件类型
     */
    GetRegisteredTypes() {
        const types = new Set();
        for (const type of this._handlers.keys())
            types.add(type);
        for (const f of this._functions)
            types.add(f.type);
        for (const type of this._onceHandlers.keys())
            types.add(type);
        return Array.from(types);
    }
}
exports.EventDispatcher = EventDispatcher;
//# sourceMappingURL=EventDispatcher.js.map