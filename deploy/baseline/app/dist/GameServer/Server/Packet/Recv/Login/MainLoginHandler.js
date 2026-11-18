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
exports.MainLoginHandler = void 0;
const protocol_1 = require("../../../../../shared/protocol");
const utils_1 = require("../../../../../shared/utils");
const decorators_1 = require("../../../../../shared/decorators");
const LoginManager_1 = require("../../../../Game/Login/LoginManager");
const proto_1 = require("../../../../../shared/proto");
/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录处理器
 * 米米号登录请�? passwordMD5(32字节)
 * 邮箱登录请求: email(64字节) + passwordMD5(32字节) + unknown(4字节) + loginType(4字节) + unknown(4字节)
 * 响应: session(16字节) + roleCreated(4字节)
 */
let MainLoginHandler = class MainLoginHandler {
    _loginManager;
    constructor(loginManager) {
        this._loginManager = loginManager;
    }
    async Handle(session, head, body) {
        // 判断登录类型：userID=0 表示邮箱登录
        if (head.UserID === 0) {
            // 邮箱登录
            const req = proto_1.MainLoginReqProto.fromEmailLogin(body);
            utils_1.Logger.Info(`邮箱登录 Email=${req.email}`);
            await this._loginManager.HandleEmailLogin(session, req.email, req.passwordMD5);
        }
        else {
            // 米米号登�?
            const req = proto_1.MainLoginReqProto.fromMimiLogin(body);
            utils_1.Logger.Info(`米米号登录 UserID=${head.UserID}`);
            await this._loginManager.HandleMainLogin(session, head.UserID, req.passwordMD5);
        }
    }
};
exports.MainLoginHandler = MainLoginHandler;
exports.MainLoginHandler = MainLoginHandler = __decorate([
    (0, decorators_1.Opcode)(protocol_1.CommandID.MAIN_LOGIN_IN, decorators_1.InjectType.LOGIN_MANAGER),
    __metadata("design:paramtypes", [LoginManager_1.LoginManager])
], MainLoginHandler);
//# sourceMappingURL=MainLoginHandler.js.map