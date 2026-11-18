"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadPercentHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const LoadPercentReqProto_1 = require("../../../../../shared/proto/packets/req/map/LoadPercentReqProto");
const PacketLoadPercent_1 = require("../../Send/Map/PacketLoadPercent");
const PvpBattleManager_1 = require("../../../../Game/Battle/PvpBattleManager");
const OnlineTracker_1 = require("../../../../Game/Player/OnlineTracker");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2441 LOAD_PERCENT] 客户端加载进度
 * 客户端定期发送加载进度，服务器返回对方（BOSS/其他玩家）的加载进度
 *
 * 场景：
 * 1. PVE战斗（打BOSS）：返回BOSS的加载进度（固定100%）
 * 2. PVP战斗（玩家对战）：广播玩家的加载进度给对方，并返回对方的加载进度
 */
let LoadPercentHandler = class LoadPercentHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        // 反序列化请求
        const req = LoadPercentReqProto_1.LoadPercentReqProto.fromBuffer(body);
        // 检查是否在PVP战斗房间中
        const pvpRoom = PvpBattleManager_1.PvpBattleManager.Instance.GetPlayerRoom(player.Uid);
        if (pvpRoom) {
            // PVP战斗：记录当前玩家的加载进度
            PvpBattleManager_1.PvpBattleManager.Instance.SetPlayerLoadPercent(player.Uid, req.percent);
            // 获取对方玩家ID和加载进度
            const opponentId = pvpRoom.player1Id === player.Uid ? pvpRoom.player2Id : pvpRoom.player1Id;
            const opponentPercent = PvpBattleManager_1.PvpBattleManager.Instance.GetOpponentLoadPercent(player.Uid);
            const opponentSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(opponentId);
            if (opponentSession?.Player) {
                // 广播当前玩家的加载进度给对方
                await opponentSession.Player.SendPacket(new PacketLoadPercent_1.PacketLoadPercent(player.Uid, req.percent));
                utils_1.Logger.Debug(`[LoadPercentHandler] PVP广播加载进度: ${player.Uid} -> ${opponentId}, percent=${req.percent}`);
            }
            // 返回对方的实际加载进度
            await player.SendPacket(new PacketLoadPercent_1.PacketLoadPercent(opponentId, opponentPercent));
        }
        else {
            // PVE战斗（打BOSS）：返回BOSS的加载进度（假设BOSS立即加载完成）
            await player.SendPacket(new PacketLoadPercent_1.PacketLoadPercent(0, 100));
        }
    }
};
exports.LoadPercentHandler = LoadPercentHandler;
exports.LoadPercentHandler = LoadPercentHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.LOAD_PERCENT, decorators_1.InjectType.NONE)
], LoadPercentHandler);
//# sourceMappingURL=LoadPercentHandler.js.map