/**
 * 依赖注入类型
 */
export declare enum InjectType {
    NONE = 0,
    LOGIN_MANAGER = 1,
    REGISTER_MANAGER = 2,
    SERVER_MANAGER = 3,
    MAP_MANAGER = 4,
    PET_MANAGER = 5,
    BATTLE_MANAGER = 6,
    ITEM_MANAGER = 7
}
/**
 * Handler类型定义
 */
export interface IHandlerClass {
    new (...args: unknown[]): IHandler;
    CMD?: number;
    INJECT?: InjectType;
}
export interface IHandler {
    Handle(session: unknown, head: unknown, body: Buffer): void | Promise<void>;
}
/**
 * Handler注册表
 */
declare class HandlerRegistry {
    private _handlers;
    /**
     * 注册Handler
     */
    Register(cmdID: number, handlerClass: IHandlerClass, injectType?: InjectType): void;
    /**
     * 获取所有已注册的Handler
     */
    GetAll(): Map<number, IHandlerClass>;
    /**
     * 获取指定命令的Handler类
     */
    Get(cmdID: number): IHandlerClass | undefined;
    /**
     * 获取已注册数量
     */
    get Count(): number;
}
export declare const Handlers: HandlerRegistry;
/**
 * [Opcode(CmdIds.xxx, InjectType.xxx)] 装饰器
 * 用于标记Handler类处理的命令ID和依赖注入类型
 *
 * @example
 * ```typescript
 * @Opcode(CommandID.MAIN_LOGIN_IN, InjectType.LOGIN_MANAGER)
 * export class MainLoginHandler implements IHandler {
 *   constructor(private _loginManager: LoginManager) {}
 *   public Handle(session: IClientSession, head: HeadInfo, body: Buffer): void {
 *     // ...
 *   }
 * }
 * ```
 */
export declare function Opcode(cmdID: number, injectType?: InjectType): ClassDecorator;
export {};
//# sourceMappingURL=Opcode.d.ts.map