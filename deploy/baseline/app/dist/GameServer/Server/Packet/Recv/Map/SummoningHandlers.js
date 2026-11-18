"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveSummoningHandler = exports.JoinSummoningHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const SummoningField_1 = require("../../../../Game/Map/SummoningField");
const MaterialGames_1 = require("../../../../Game/Map/MaterialGames");
const MaterialHandlers_1 = require("./MaterialHandlers");
let JoinSummoningHandler = class JoinSummoningHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 4) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.JOIN_GAME).setResult(5001));
            return;
        }
        const gameId = body.readUInt32BE(0);
        if (player.Data.mapID === SummoningField_1.SummoningField.MAP_ID) {
            await SummoningField_1.SummoningField.For(player).Join(gameId);
            return;
        }
        try {
            MaterialGames_1.MaterialGames.Join(player, gameId);
        }
        catch (err) {
            const utils_1 = require("../../../../../shared/utils");
            utils_1.Logger.Warn(`[JOIN_GAME] 用户 ${player.Uid} 参加小游戏 gameId=${gameId} mapId=${player.Data.mapID}: ${err.message}`);
            await player.SendPacket(new MaterialHandlers_1.MaterialPacket(CommandID_1.CommandID.JOIN_GAME, [gameId]));
            return;
        }
        await player.SendPacket(new MaterialHandlers_1.MaterialPacket(CommandID_1.CommandID.JOIN_GAME, [gameId]));
    }
};
exports.JoinSummoningHandler = JoinSummoningHandler;
exports.JoinSummoningHandler = JoinSummoningHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.JOIN_GAME, decorators_1.InjectType.NONE)
], JoinSummoningHandler);
let LeaveSummoningHandler = class LeaveSummoningHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (player.Data.mapID !== SummoningField_1.SummoningField.MAP_ID || body.length !== 4 || body.readUInt32BE(0) !== 1) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.LEAVE_GAME).setResult(5001));
            return;
        }
        // The native appearance notification releases the pad immediately; walking afterward keeps the summoned boss.
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.LEAVE_GAME));
    }
};
exports.LeaveSummoningHandler = LeaveSummoningHandler;
exports.LeaveSummoningHandler = LeaveSummoningHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.LEAVE_GAME, decorators_1.InjectType.NONE)
], LeaveSummoningHandler);
//# sourceMappingURL=SummoningHandlers.js.map