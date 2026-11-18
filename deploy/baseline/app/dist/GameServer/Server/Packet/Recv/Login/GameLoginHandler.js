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
exports.GameLoginHandler = void 0;
const protocol_1 = require("../../../../../shared/protocol");
const utils_1 = require("../../../../../shared/utils");
const decorators_1 = require("../../../../../shared/decorators");
const LoginManager_1 = require("../../../../Game/Login/LoginManager");
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录处理�?
 * 请求: session(16字节)
 * 响应: 完整玩家信息
 */
let GameLoginHandler = class GameLoginHandler {
    _loginManager;
    constructor(loginManager) {
        this._loginManager = loginManager;
    }
    async Handle(session, head, body) {
        utils_1.Logger.Info(`游戏登录 UserID=${head.UserID}`);
        await this._loginManager.HandleGameLogin(session, head.UserID, body);
    }
};
exports.GameLoginHandler = GameLoginHandler;
exports.GameLoginHandler = GameLoginHandler = __decorate([
    (0, decorators_1.Opcode)(protocol_1.CommandID.LOGIN_IN, decorators_1.InjectType.LOGIN_MANAGER),
    __metadata("design:paramtypes", [LoginManager_1.LoginManager])
], GameLoginHandler);
//# sourceMappingURL=GameLoginHandler.js.map