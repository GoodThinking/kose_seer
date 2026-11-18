"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveDarkPortalHandler = exports.FightDarkPortalHandler = exports.OpenDarkPortalHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const BossAbilityConfig_1 = require("../../../../Game/Battle/BossAbility/BossAbilityConfig");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const Logger_1 = require("../../../../../shared/utils/Logger");
const DARK_MAP = 110;
const DARK_KEY = 400053;
const openedDoor = new WeakMap();
class DarkPortalOpenPacket extends BaseProto_1.BaseProto {
    constructor(petId) {
        super(CommandID_1.CommandID.OPEN_DARKPORTAL);
        this.petId = petId;
    }
    serialize() {
        const body = Buffer.alloc(4);
        body.writeUInt32BE(this.petId, 0);
        return body;
    }
}
function doorBoss(door) {
    if (!Number.isInteger(door) || door < 0 || door > 200)
        return undefined;
    return BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(DARK_MAP, 1000 + door);
}
function canEnter(player, door) {
    if (player.Data.superNono)
        return true;
    if (door !== 0)
        return false;
    return player.ItemManager.ItemData.ItemList.some(item => item.itemId === DARK_KEY && item.count > 0);
}
let OpenDarkPortalHandler = class OpenDarkPortalHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const door = body.length >= 4 ? body.readUInt32BE(0) : -1;
        const boss = doorBoss(door);
        if (!boss || !canEnter(player, door)) {
            await player.SendPacket(new DarkPortalOpenPacket(0).setResult(5001));
            return;
        }
        openedDoor.set(player, door);
        Logger_1.Logger.Info(`[DarkPortal] 开门: UserID=${player.Uid}, Door=${door}, Pet=${boss.petId}`);
        await player.SendPacket(new DarkPortalOpenPacket(boss.petId));
    }
};
exports.OpenDarkPortalHandler = OpenDarkPortalHandler;
exports.OpenDarkPortalHandler = OpenDarkPortalHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.OPEN_DARKPORTAL, decorators_1.InjectType.NONE)
], OpenDarkPortalHandler);
let FightDarkPortalHandler = class FightDarkPortalHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const door = openedDoor.get(player);
        if (body.length || door === undefined || !doorBoss(door)) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.FIGHT_DARKPORTAL).setResult(5001));
            return;
        }
        openedDoor.delete(player);
        await player.BattleManager.HandleDarkPortalFight(door);
    }
};
exports.FightDarkPortalHandler = FightDarkPortalHandler;
exports.FightDarkPortalHandler = FightDarkPortalHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FIGHT_DARKPORTAL, decorators_1.InjectType.NONE)
], FightDarkPortalHandler);
let LeaveDarkPortalHandler = class LeaveDarkPortalHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        openedDoor.delete(player);
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.LEAVE_DARKPORTAL));
    }
};
exports.LeaveDarkPortalHandler = LeaveDarkPortalHandler;
exports.LeaveDarkPortalHandler = LeaveDarkPortalHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.LEAVE_DARKPORTAL, decorators_1.InjectType.NONE)
], LeaveDarkPortalHandler);
