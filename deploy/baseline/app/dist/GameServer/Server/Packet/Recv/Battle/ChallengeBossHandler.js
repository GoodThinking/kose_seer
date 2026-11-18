"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeBossHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChallengeBossReqProto_1 = require("../../../../../shared/proto/packets/req/battle/ChallengeBossReqProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
const SummoningField_1 = require("../../../../Game/Map/SummoningField");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS
 *
 * 客户端发送param2，服务器结合玩家当前地图ID查找BOSS
 * 逻辑与 go-server handleChallengeBoss 保持一致
 */
let ChallengeBossHandler = class ChallengeBossHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player) {
            return;
        }
        // 解析请求
        const req = new ChallengeBossReqProto_1.ChallengeBossReqProto();
        if (body.length > 0) {
            req.deserialize(body);
        }
        // 获取玩家当前地图ID
        let mapId = player.Data.mapID || 1;
        if (mapId === 0) {
            mapId = 1;
        }
        // Native map 514 is local-only; the server still records tower entrance 108.
        if (mapId === 108) {
            mapId = 514;
        }
        const param2 = req.bossId; // 客户端发送的是param2，字段名保持bossId向后兼容
        if (mapId === SummoningField_1.SummoningField.MAP_ID && !SummoningField_1.SummoningField.For(player).CanChallenge(param2)) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.CHALLENGE_BOSS).setResult(5001));
            return;
        }
        Logger_1.Logger.Info(`[ChallengeBossHandler] 收到挑战BOSS请求: UserID=${player.Uid}, ` +
            `MapID=${mapId}, Param2=${param2}, BodyLen=${body.length}`);
        // 调用 BattleManager 处理
        await player.BattleManager.HandleChallengeBoss(mapId, param2);
    }
};
exports.ChallengeBossHandler = ChallengeBossHandler;
exports.ChallengeBossHandler = ChallengeBossHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.CHALLENGE_BOSS, decorators_1.InjectType.NONE)
], ChallengeBossHandler);
//# sourceMappingURL=ChallengeBossHandler.js.map