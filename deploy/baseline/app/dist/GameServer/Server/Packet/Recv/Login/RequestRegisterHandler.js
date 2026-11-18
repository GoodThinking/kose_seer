"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestRegisterHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const Register_1 = require("../../../../Game/Register");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 1003 REQUEST_REGISTER] 请求注册处理器
 * 预留接口，暂时返回成功响应
 */
let RequestRegisterHandler = class RequestRegisterHandler {
    _registerManager;
    constructor(registerManager) {
        this._registerManager = registerManager;
    }
    async Handle(session, _head, _body) {
        try {
            utils_1.Logger.Info('[RequestRegisterHandler] 请求注册');
            await this._registerManager.HandleRequestRegister(session);
        }
        catch (err) {
            utils_1.Logger.Error('[RequestRegisterHandler] 处理请求注册失败', err);
        }
    }
};
exports.RequestRegisterHandler = RequestRegisterHandler;
exports.RequestRegisterHandler = RequestRegisterHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.REQUEST_REGISTER, decorators_1.InjectType.REGISTER_MANAGER),
    __metadata("design:paramtypes", [Register_1.RegisterManager])
], RequestRegisterHandler);
//# sourceMappingURL=RequestRegisterHandler.js.map