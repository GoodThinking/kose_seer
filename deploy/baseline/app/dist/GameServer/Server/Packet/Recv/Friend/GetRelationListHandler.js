"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRelationListHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketGetRelationList_1 = require("../../../Packet/Send/Friend/PacketGetRelationList");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * [CMD: 2150 GET_RELATION_LIST] 获取好友关系列表
 * 返回好友列表和黑名单
 */
let GetRelationListHandler = class GetRelationListHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            Logger_1.Logger.Debug(`[GetRelationListHandler] 用户 ${player.Uid} 请求好友列表`);
            // 发送好友列表和黑名单
            await player.SendPacket(new PacketGetRelationList_1.PacketGetRelationList(player.FriendManager.GetFriendList(), player.FriendManager.GetBlackList()));
        }
        catch (error) {
            Logger_1.Logger.Error(`[GetRelationListHandler] 失败`, error);
            await player.SendPacket(new PacketGetRelationList_1.PacketGetRelationList([], []).setResult(5000));
        }
    }
};
exports.GetRelationListHandler = GetRelationListHandler;
exports.GetRelationListHandler = GetRelationListHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.GET_RELATION_LIST, Opcode_1.InjectType.NONE)
], GetRelationListHandler);
//# sourceMappingURL=GetRelationListHandler.js.map