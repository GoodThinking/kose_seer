"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerDisconnectHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PlayerManager_1 = require("../../../../Game/Player/PlayerManager");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 10004 PLAYER_DISCONNECT] 玩家断开连接处理器（内部命令）
 * 由 Gateway 在检测到客户端断开连接时调用
 */
let PlayerDisconnectHandler = class PlayerDisconnectHandler {
    async Handle(_session, head, _body) {
        const userID = head.UserID;
        utils_1.Logger.Info(`[PlayerDisconnectHandler] 收到玩家断线通知: UserID=${userID}`);
        // 调用 PlayerManager 移除玩家（会触发 OnLogout）
        await PlayerManager_1.PlayerManager.GetInstance().RemovePlayer(userID);
        utils_1.Logger.Info(`[PlayerDisconnectHandler] 玩家 ${userID} 已下线`);
    }
};
exports.PlayerDisconnectHandler = PlayerDisconnectHandler;
exports.PlayerDisconnectHandler = PlayerDisconnectHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PLAYER_DISCONNECT, decorators_1.InjectType.NONE)
], PlayerDisconnectHandler);
//# sourceMappingURL=PlayerDisconnectHandler.js.map