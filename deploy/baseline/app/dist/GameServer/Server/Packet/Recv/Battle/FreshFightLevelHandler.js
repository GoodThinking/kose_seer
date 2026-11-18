"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreshLeaveFightLevelHandler = exports.FreshStartFightLevelHandler = exports.FreshChoiceFightLevelHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const PacketFreshFightLevel_1 = require("../../Send/Battle/PacketFreshFightLevel");
const FreshTower_1 = require("../../../../Game/Battle/FreshTower");
let FreshChoiceFightLevelHandler = class FreshChoiceFightLevelHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const requested = body.length >= 4 ? body.readUInt32BE(0) : 0;
        const floor = (0, FreshTower_1.resolveFreshTowerFloor)(requested, player.Data.curFreshStage || 0, player.Data.maxFreshStage || 0);
        player.Data.curFreshStage = floor;
        player.Data.maxFreshStage = Math.max(player.Data.maxFreshStage || 0, floor - 1);
        await (0, FreshTower_1.saveFreshTowerProgress)(player.Uid, player.Data.curFreshStage, player.Data.maxFreshStage);
        await player.SendPacket(new PacketFreshFightLevel_1.PacketFreshFightLevel(CommandID_1.CommandID.FRESH_CHOICE_FIGHT_LEVEL, floor, (0, FreshTower_1.freshTowerBosses)(floor)));
    }
};
exports.FreshChoiceFightLevelHandler = FreshChoiceFightLevelHandler;
exports.FreshChoiceFightLevelHandler = FreshChoiceFightLevelHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FRESH_CHOICE_FIGHT_LEVEL, decorators_1.InjectType.NONE)
], FreshChoiceFightLevelHandler);
let FreshStartFightLevelHandler = class FreshStartFightLevelHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        const floor = Math.min(FreshTower_1.FRESH_TOWER_MAX, Math.max(1, player.Data.curFreshStage || 1));
        const healthy = player.PetManager.GetPetsInBag().some(pet => pet.hp > 0);
        if (!healthy) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.FRESH_START_FIGHT_LEVEL).setResult(10017));
            return;
        }
        const bosses = (0, FreshTower_1.freshTowerBosses)(floor);
        const next = floor >= FreshTower_1.FRESH_TOWER_MAX ? [] : (0, FreshTower_1.freshTowerBosses)(floor + 1);
        await player.SendPacket(new PacketFreshFightLevel_1.PacketFreshFightLevel(CommandID_1.CommandID.FRESH_START_FIGHT_LEVEL, floor, next));
        await player.BattleManager.StartFreshTowerBattle(bosses[0], (0, FreshTower_1.freshTowerEnemyLevel)(floor), floor);
    }
};
exports.FreshStartFightLevelHandler = FreshStartFightLevelHandler;
exports.FreshStartFightLevelHandler = FreshStartFightLevelHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FRESH_START_FIGHT_LEVEL, decorators_1.InjectType.NONE)
], FreshStartFightLevelHandler);
let FreshLeaveFightLevelHandler = class FreshLeaveFightLevelHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.FRESH_LEAVE_FIGHT_LEVEL));
    }
};
exports.FreshLeaveFightLevelHandler = FreshLeaveFightLevelHandler;
exports.FreshLeaveFightLevelHandler = FreshLeaveFightLevelHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FRESH_LEAVE_FIGHT_LEVEL, decorators_1.InjectType.NONE)
], FreshLeaveFightLevelHandler);
//# sourceMappingURL=FreshFightLevelHandler.js.map