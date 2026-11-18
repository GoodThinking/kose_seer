import { Logger } from '../../../shared/utils';

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

export type EventHandlerFn<T extends IGameEvent = IGameEvent> = (
  event: T,
  context?: IEventContext
) => Promise<void> | void;

export class EventDispatcher {
  private _handlers: Map<string, IEventHandler[]> = new Map();
  private _functions: Array<{ type: string; fn: EventHandlerFn; priority: number }> = [];
  private _onceHandlers: Map<string, Array<{ fn: EventHandlerFn; priority: number }>> = new Map();

  /**
   * 注册事件处理器（持久）
   */
  public Register(type: string, fn: EventHandlerFn, priority: number = 100): void {
    this._functions.push({ type, fn, priority });
    this._functions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 注册一次性处理器（执行后自动移除）
   */
  public RegisterOnce(type: string, fn: EventHandlerFn, priority: number = 100): void {
    const list = this._onceHandlers.get(type) || [];
    list.push({ fn, priority });
    list.sort((a, b) => a.priority - b.priority);
    this._onceHandlers.set(type, list);
  }

  /**
   * 注册类处理器
   */
  public RegisterHandler(handler: IEventHandler): void {
    const list = this._handlers.get(handler.eventType) || [];
    list.push(handler);
    list.sort((a, b) => a.priority - b.priority);
    this._handlers.set(handler.eventType, list);
  }

  /**
   * 移除指定类型的处理器
   */
  public Unregister(type: string, fn?: EventHandlerFn): void {
    if (fn) {
      this._functions = this._functions.filter(f => !(f.type === type && f.fn === fn));
    } else {
      this._functions = this._functions.filter(f => f.type !== type);
      this._handlers.delete(type);
      this._onceHandlers.delete(type);
    }
  }

  /**
   * 派发事件
   */
  public async Dispatch(event: IGameEvent): Promise<void> {
    // 1. 类处理器
    const handlers = this._handlers.get(event.type) || [];
    for (const h of handlers) {
      try {
        await h.handle(event as any);
      } catch (error) {
        Logger.Error(`[EventDispatcher] Handler ${h.constructor.name} error`, error as Error);
      }
    }

    // 2. 持久函数处理器
    const fns = this._functions.filter(f => f.type === event.type);
    for (const { fn } of fns) {
      try {
        await fn(event as any);
      } catch (error) {
        Logger.Error(`[EventDispatcher] Handler fn error`, error as Error);
      }
    }

    // 3. 一次性处理器（执行后移除）
    const onceFns = this._onceHandlers.get(event.type) || [];
    this._onceHandlers.delete(event.type);
    for (const { fn } of onceFns) {
      try {
        await fn(event as any);
      } catch (error) {
        Logger.Error(`[EventDispatcher] Once handler fn error`, error as Error);
      }
    }
  }

  /**
   * 同步派发（用于需要立即生效的场景）
   */
  public DispatchSync(event: IGameEvent): void {
    const handlers = this._handlers.get(event.type) || [];
    for (const h of handlers) {
      try {
        h.handle(event as any);
      } catch (error) {
        Logger.Error(`[EventDispatcher] Sync handler error`, error as Error);
      }
    }

    const fns = this._functions.filter(f => f.type === event.type);
    for (const { fn } of fns) {
      try {
        fn(event as any);
      } catch (error) {
        Logger.Error(`[EventDispatcher] Sync fn error`, error as Error);
      }
    }
  }

  /**
   * 清空所有处理器
   */
  public Clear(): void {
    this._handlers.clear();
    this._functions = [];
    this._onceHandlers.clear();
  }

  /**
   * 获取处理器数量
   */
  public GetHandlerCount(type: string): number {
    const classCount = (this._handlers.get(type) || []).length;
    const fnCount = this._functions.filter(f => f.type === type).length;
    const onceCount = (this._onceHandlers.get(type) || []).length;
    return classCount + fnCount + onceCount;
  }

  /**
   * 获取所有已注册的事件类型
   */
  public GetRegisteredTypes(): string[] {
    const types = new Set<string>();
    for (const type of this._handlers.keys()) types.add(type);
    for (const f of this._functions) types.add(f.type);
    for (const type of this._onceHandlers.keys()) types.add(type);
    return Array.from(types);
  }
}
