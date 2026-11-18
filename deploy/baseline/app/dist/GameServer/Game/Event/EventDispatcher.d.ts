export interface IGameEvent {
    type: string;
    timestamp: number;
    playerId?: number;
}
export interface IEventHandler<T extends IGameEvent = IGameEvent> {
    readonly eventType: string;
    priority: number;
    handle(event: T): Promise<void> | void;
}
export interface IEventContext {
    player: any;
    battle?: any;
}
export type EventHandlerFn<T extends IGameEvent = IGameEvent> = (event: T, context?: IEventContext) => Promise<void> | void;
export declare class EventDispatcher {
    private _handlers;
    private _functions;
    private _onceHandlers;
    /**
     * 注册事件处理器（持久）
     */
    Register(type: string, fn: EventHandlerFn, priority?: number): void;
    /**
     * 注册一次性处理器（执行后自动移除）
     */
    RegisterOnce(type: string, fn: EventHandlerFn, priority?: number): void;
    /**
     * 注册类处理器
     */
    RegisterHandler(handler: IEventHandler): void;
    /**
     * 移除指定类型的处理器
     */
    Unregister(type: string, fn?: EventHandlerFn): void;
    /**
     * 派发事件
     */
    Dispatch(event: IGameEvent): Promise<void>;
    /**
     * 同步派发（用于需要立即生效的场景）
     */
    DispatchSync(event: IGameEvent): void;
    /**
     * 清空所有处理器
     */
    Clear(): void;
    /**
     * 获取处理器数量
     */
    GetHandlerCount(type: string): number;
    /**
     * 获取所有已注册的事件类型
     */
    GetRegisteredTypes(): string[];
}
//# sourceMappingURL=EventDispatcher.d.ts.map