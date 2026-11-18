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
exports.CreateRoleHandler = void 0;
const protocol_1 = require("../../../../../shared/protocol");
const utils_1 = require("../../../../../shared/utils");
const decorators_1 = require("../../../../../shared/decorators");
const LoginManager_1 = require("../../../../Game/Login/LoginManager");
const proto_1 = require("../../../../../shared/proto");
/**
 * [CMD: CREATE_ROLE (108)] 创建角色处理�?
 * 请求: userID(4字节) + nickname(16字节) + color(4字节) = 24字节
 * 响应: session(16字节)
 */
let CreateRoleHandler = class CreateRoleHandler {
    _loginManager;
    constructor(loginManager) {
        this._loginManager = loginManager;
    }
    async Handle(session, head, body) {
        const req = proto_1.CreateRoleReqProto.fromBuffer(body);
        utils_1.Logger.Info(`创建角色: userID=${req.userID}, nickname=${req.nickname}, color=${req.color}`);
        await this._loginManager.CreatePlayer(session, req.userID, req.nickname, req.color);
    }
};
exports.CreateRoleHandler = CreateRoleHandler;
exports.CreateRoleHandler = CreateRoleHandler = __decorate([
    (0, decorators_1.Opcode)(protocol_1.CommandID.CREATE_ROLE, decorators_1.InjectType.LOGIN_MANAGER),
    __metadata("design:paramtypes", [LoginManager_1.LoginManager])
], CreateRoleHandler);
//# sourceMappingURL=CreateRoleHandler.js.map