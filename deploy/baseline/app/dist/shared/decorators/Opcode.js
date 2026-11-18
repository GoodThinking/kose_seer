"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Handlers = exports.InjectType = void 0;
exports.Opcode = Opcode;
/**
 * 依赖注入类型
 */
var InjectType;
(function (InjectType) {
    InjectType[InjectType["NONE"] = 0] = "NONE";
    InjectType[InjectType["LOGIN_MANAGER"] = 1] = "LOGIN_MANAGER";
    InjectType[InjectType["REGISTER_MANAGER"] = 2] = "REGISTER_MANAGER";
    InjectType[InjectType["SERVER_MANAGER"] = 3] = "SERVER_MANAGER";
    InjectType[InjectType["MAP_MANAGER"] = 4] = "MAP_MANAGER";
    InjectType[InjectType["PET_MANAGER"] = 5] = "PET_MANAGER";
    InjectType[InjectType["BATTLE_MANAGER"] = 6] = "BATTLE_MANAGER";
    InjectType[InjectType["ITEM_MANAGER"] = 7] = "ITEM_MANAGER";
})(InjectType || (exports.InjectType = InjectType = {}));
/**
 * Handler注册表
 */
class HandlerRegistry {
    _handlers = new Map();
    /**
     * 注册Handler
     */
    Register(cmdID, handlerClass, injectType = InjectType.NONE) {
        this._handlers.set(cmdID, handlerClass);
        handlerClass.CMD = cmdID;
        handlerClass.INJECT = injectType;
    }
    /**
     * 获取所有已注册的Handler
     */
    GetAll() {
        return this._handlers;
    }
    /**
     * 获取指定命令的Handler类
     */
    Get(cmdID) {
        return this._handlers.get(cmdID);
    }
    /**
     * 获取已注册数量
     */
    get Count() {
        return this._handlers.size;
    }
}
// 全局Handler注册表
exports.Handlers = new HandlerRegistry();
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
function Opcode(cmdID, injectType = InjectType.NONE) {
    return function (target) {
        exports.Handlers.Register(cmdID, target, injectType);
        // 添加静态属性
        Object.defineProperty(target, 'CMD', {
            value: cmdID,
            writable: false,
            enumerable: true,
            configurable: false
        });
        Object.defineProperty(target, 'INJECT', {
            value: injectType,
            writable: false,
            enumerable: true,
            configurable: false
        });
    };
}
//# sourceMappingURL=Opcode.js.map