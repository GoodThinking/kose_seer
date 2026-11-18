"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttackBossHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const PacketMapBoss_1 = require("../../Send/Map/PacketMapBoss");
const SummoningField_1 = require("../../../../Game/Map/SummoningField");
/** Preserve ordinary stationary bosses; map 502 uses the native local shield animation. */
let AttackBossHandler = class AttackBossHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const region = body.length >= 4 ? body.readUInt32BE(0) : 0;
        if (player.Data.mapID === SummoningField_1.SummoningField.MAP_ID) {
            const accepted = body.length === 4 && SummoningField_1.SummoningField.For(player).Hit(region);
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.ATTACK_BOSS).setResult(accepted ? 0 : 5001));
            return;
        }
        const spawn = player.MapSpawnManager;
        const boss = spawn.HitBoss(player.Data.mapID, region);
        if (boss)
            await player.SendPacket(new PacketMapBoss_1.PacketMapBoss([boss]));
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.ATTACK_BOSS));
    }
};
exports.AttackBossHandler = AttackBossHandler;
exports.AttackBossHandler = AttackBossHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.ATTACK_BOSS, decorators_1.InjectType.NONE)
], AttackBossHandler);
//# sourceMappingURL=AttackBossHandler.js.map