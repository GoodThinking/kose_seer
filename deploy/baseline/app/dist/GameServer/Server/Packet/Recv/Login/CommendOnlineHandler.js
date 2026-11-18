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
exports.CommendOnlineHandler = void 0;
const protocol_1 = require("../../../../../shared/protocol");
const utils_1 = require("../../../../../shared/utils");
const decorators_1 = require("../../../../../shared/decorators");
const ServerManager_1 = require("../../../../Game/Server/ServerManager");
/**
 * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表处理器
 * 请求:
 * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers...
 */
let CommendOnlineHandler = class CommendOnlineHandler {
    _serverManager;
    constructor(serverManager) {
        this._serverManager = serverManager;
    }
    async Handle(session, head, _body) {
        utils_1.Logger.Info(`[CommendOnlineHandler] 请求服务器列表: UserID=${head.UserID}`);
        try {
            await this._serverManager.HandleCommendOnline(session, head.UserID);
            utils_1.Logger.Info(`[CommendOnlineHandler] 服务器列表已发送`);
        }
        catch (err) {
            utils_1.Logger.Error(`[CommendOnlineHandler] 处理失败`, err);
        }
    }
};
exports.CommendOnlineHandler = CommendOnlineHandler;
exports.CommendOnlineHandler = CommendOnlineHandler = __decorate([
    (0, decorators_1.Opcode)(protocol_1.CommandID.COMMEND_ONLINE, decorators_1.InjectType.SERVER_MANAGER),
    __metadata("design:paramtypes", [ServerManager_1.ServerManager])
], CommendOnlineHandler);
//# sourceMappingURL=CommendOnlineHandler.js.map