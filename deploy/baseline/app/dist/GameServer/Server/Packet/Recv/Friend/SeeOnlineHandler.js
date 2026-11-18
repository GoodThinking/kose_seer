"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeeOnlineHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const SeeOnlineReqProto_1 = require("../../../../../shared/proto/packets/req/friend/SeeOnlineReqProto");
const SeeOnlineRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/SeeOnlineRspProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
const PlayerManager_1 = require("../../../../Game/Player/PlayerManager");
const OnlineTracker_1 = require("../../../../Game/Player/OnlineTracker");
/**
 * 查看在线状态处理器
 * CMD 2157
 */
let SeeOnlineHandler = class SeeOnlineHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = SeeOnlineReqProto_1.SeeOnlineReqProto.fromBuffer(body);
            Logger_1.Logger.Info(`[SeeOnlineHandler] 玩家 ${player.Uid} 查询在线状态: ` +
                `count=${req.count}, userIds=[${req.userIds.join(', ')}]`);
            // 查询在线用户
            const onlineUsers = [];
            const playerManager = PlayerManager_1.PlayerManager.GetInstance();
            for (const targetUserId of req.userIds) {
                // 检查用户是否在线
                if (OnlineTracker_1.OnlineTracker.Instance.IsOnline(targetUserId)) {
                    const targetPlayer = playerManager.GetPlayer(targetUserId);
                    if (targetPlayer) {
                        onlineUsers.push({
                            userId: targetUserId,
                            serverId: 1, // 当前服务器ID
                            mapType: 0, // 默认地图类型
                            mapId: targetPlayer.Data.mapID || 1
                        });
                    }
                }
            }
            // 构建响应
            const rsp = new SeeOnlineRspProto_1.SeeOnlineRspProto();
            rsp.setOnlineUsers(onlineUsers);
            await player.SendPacket(rsp);
            Logger_1.Logger.Info(`[SeeOnlineHandler] 返回在线状态: uid=${player.Uid}, ` +
                `requested=${req.count}, online=${onlineUsers.length}`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[SeeOnlineHandler] 处理失败: uid=${player.Uid}`, error);
            // 发生错误时返回空列表
            const rsp = new SeeOnlineRspProto_1.SeeOnlineRspProto();
            rsp.setOnlineUsers([]);
            await player.SendPacket(rsp);
        }
    }
};
exports.SeeOnlineHandler = SeeOnlineHandler;
exports.SeeOnlineHandler = SeeOnlineHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.SEE_ONLINE, decorators_1.InjectType.NONE)
], SeeOnlineHandler);
//# sourceMappingURL=SeeOnlineHandler.js.map