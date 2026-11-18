"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveFightLevelHandler = exports.StartFightLevelHandler = exports.ChoiceFightLevelHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const PacketFightLevel_1 = require("../../Send/Battle/PacketFightLevel");
const BraveTower_1 = require("../../../../Game/Battle/BraveTower");
let ChoiceFightLevelHandler = class ChoiceFightLevelHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const requested = body.length >= 4 ? body.readUInt32BE(0) : 0;
        const floor = (0, BraveTower_1.resolveBraveTowerFloor)(requested, player.Data.curStage || 0, player.Data.maxStage || 0);
        player.Data.curStage = floor;
        await (0, BraveTower_1.saveBraveTowerStage)(player.Uid, player.Data.curStage, player.Data.maxStage || 0);
        await player.SendPacket(new PacketFightLevel_1.PacketFightLevel(CommandID_1.CommandID.CHOICE_FIGHT_LEVEL, floor, (0, BraveTower_1.braveTowerBosses)(floor)));
    }
};
exports.ChoiceFightLevelHandler = ChoiceFightLevelHandler;
exports.ChoiceFightLevelHandler = ChoiceFightLevelHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.CHOICE_FIGHT_LEVEL, decorators_1.InjectType.NONE)
], ChoiceFightLevelHandler);
let StartFightLevelHandler = class StartFightLevelHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        const floor = Math.min(BraveTower_1.BRAVE_TOWER_MAX, Math.max(1, player.Data.curStage || 1));
        const healthy = player.PetManager.GetPetsInBag().some(pet => pet.hp > 0);
        if (!healthy) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.START_FIGHT_LEVEL).setResult(10017));
            return;
        }
        const bosses = (0, BraveTower_1.braveTowerBosses)(floor);
        const next = floor >= BraveTower_1.BRAVE_TOWER_MAX ? [] : (0, BraveTower_1.braveTowerBosses)(floor + 1);
        await player.SendPacket(new PacketFightLevel_1.PacketFightLevel(CommandID_1.CommandID.START_FIGHT_LEVEL, floor, next));
        await player.BattleManager.StartBraveTowerBattle(bosses[0], (0, BraveTower_1.braveTowerEnemyLevel)(floor), floor);
    }
};
exports.StartFightLevelHandler = StartFightLevelHandler;
exports.StartFightLevelHandler = StartFightLevelHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.START_FIGHT_LEVEL, decorators_1.InjectType.NONE)
], StartFightLevelHandler);
let LeaveFightLevelHandler = class LeaveFightLevelHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.LEAVE_FIGHT_LEVEL));
    }
};
exports.LeaveFightLevelHandler = LeaveFightLevelHandler;
exports.LeaveFightLevelHandler = LeaveFightLevelHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.LEAVE_FIGHT_LEVEL, decorators_1.InjectType.NONE)
], LeaveFightLevelHandler);
//# sourceMappingURL=FightLevelHandler.js.map