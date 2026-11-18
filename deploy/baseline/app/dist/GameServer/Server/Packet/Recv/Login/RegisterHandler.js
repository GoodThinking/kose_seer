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
exports.RegisterHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const Register_1 = require("../../../../Game/Register");
const proto_1 = require("../../../../../shared/proto");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2 REGISTER] 注册账号处理器
 */
let RegisterHandler = class RegisterHandler {
    _registerManager;
    constructor(registerManager) {
        this._registerManager = registerManager;
    }
    async Handle(session, _head, body) {
        try {
            // 解析请求
            const req = new proto_1.RegisterReqProto();
            req.deserialize(body);
            utils_1.Logger.Info(`[RegisterHandler] 注册请求: email=${req.emailAddress}, password长度=${req.password.length}`);
            // 处理注册
            await this._registerManager.HandleRegister(session, req.password, req.emailAddress, req.emailCode, req.emailCodeRes);
        }
        catch (err) {
            utils_1.Logger.Error('[RegisterHandler] 处理注册请求失败', err);
        }
    }
};
exports.RegisterHandler = RegisterHandler;
exports.RegisterHandler = RegisterHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.REGISTER, decorators_1.InjectType.REGISTER_MANAGER),
    __metadata("design:paramtypes", [Register_1.RegisterManager])
], RegisterHandler);
//# sourceMappingURL=RegisterHandler.js.map