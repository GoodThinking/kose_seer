"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveMaterialDarkGateHandler = exports.FightMaterialDarkGateHandler = exports.OpenMaterialDarkGateHandler = exports.FortressMaterialHandler = exports.MaterialGameOverHandler = exports.MaterialPacket = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const ConfigLoader_1 = require("../../../../../shared/config/ConfigLoader");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const MaterialGames_1 = require("../../../../Game/Map/MaterialGames");
const MaterialRewards_1 = require("../../../../Game/Item/MaterialRewards");
class MaterialPacket extends BaseProto_1.BaseProto {
    values;
    constructor(command, values) {
        super(command);
        this.values = values;
    }
    serialize() {
        const body = Buffer.alloc(this.values.length * 4);
        this.values.forEach((value, index) => body.writeUInt32BE(value, index * 4));
        return body;
    }
}
exports.MaterialPacket = MaterialPacket;
let MaterialGameOverHandler = class MaterialGameOverHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 8) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GAME_OVER).setResult(5001));
            return;
        }
        const score = body.readUInt32BE(0);
        let rewards;
        try {
            rewards = await MaterialGames_1.MaterialGames.Finish(player, score);
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.GAME_OVER).setResult(5001));
            return;
        }
        await player.SendPacket(new MaterialPacket(CommandID_1.CommandID.GAME_OVER, [score, 0, 0, 0, rewards.length, ...rewards.flatMap(item => [item.itemId, item.count])]));
    }
};
exports.MaterialGameOverHandler = MaterialGameOverHandler;
exports.MaterialGameOverHandler = MaterialGameOverHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GAME_OVER, decorators_1.InjectType.NONE)
], MaterialGameOverHandler);
let FortressMaterialHandler = class FortressMaterialHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
        if (!config)
            throw new Error('Material source configuration missing');
        const field = config.fortress;
        try {
            if (body.length)
                throw new Error('Invalid supply collection request');
            await (0, MaterialRewards_1.GrantMaterials)(player, () => {
                if (player.Data.mapID !== field.mapId)
                    throw new Error('Outside fortress supply field');
                return [{ itemId: field.itemId, count: field.count }];
            });
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TEAM_PK_ACTIVE_GET_STONE).setResult(5001));
            return;
        }
        await player.SendPacket(new MaterialPacket(CommandID_1.CommandID.TEAM_PK_ACTIVE_GET_STONE, [field.itemId, field.count]));
    }
};
exports.FortressMaterialHandler = FortressMaterialHandler;
exports.FortressMaterialHandler = FortressMaterialHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.TEAM_PK_ACTIVE_GET_STONE, decorators_1.InjectType.NONE)
], FortressMaterialHandler);
const openedDarkGate = new WeakSet();
function darkGate(player) {
    const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
    if (!config)
        throw new Error('Material source configuration missing');
    const gate = config.darkGate;
    if (player.Data.mapID !== gate.mapId)
        throw new Error('Outside dark arena');
    if (!player.Data.superNono && !player.ItemManager.ItemData.ItemList.some(item => item.itemId === 400053 && item.count > 0)) {
        throw new Error('Dark key or Super NoNo required');
    }
    return gate;
}
let OpenMaterialDarkGateHandler = class OpenMaterialDarkGateHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        let petId;
        try {
            const gate = darkGate(player);
            if (body.length !== 4 || body.readUInt32BE(0) !== gate.door)
                throw new Error('Unsupported dark gate');
            petId = gate.petId;
            openedDarkGate.add(player);
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.OPEN_DARKPORTAL).setResult(5001));
            return;
        }
        await player.SendPacket(new MaterialPacket(CommandID_1.CommandID.OPEN_DARKPORTAL, [petId]));
    }
};
exports.OpenMaterialDarkGateHandler = OpenMaterialDarkGateHandler;
exports.OpenMaterialDarkGateHandler = OpenMaterialDarkGateHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.OPEN_DARKPORTAL, decorators_1.InjectType.NONE)
], OpenMaterialDarkGateHandler);
let FightMaterialDarkGateHandler = class FightMaterialDarkGateHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            darkGate(player);
            if (body.length || !openedDarkGate.delete(player))
                throw new Error('Dark gate not opened');
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.FIGHT_DARKPORTAL).setResult(5001));
            return;
        }
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.FIGHT_DARKPORTAL));
        await player.BattleManager.HandleChallengeBoss(player.Data.mapID, 0);
    }
};
exports.FightMaterialDarkGateHandler = FightMaterialDarkGateHandler;
exports.FightMaterialDarkGateHandler = FightMaterialDarkGateHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FIGHT_DARKPORTAL, decorators_1.InjectType.NONE)
], FightMaterialDarkGateHandler);
let LeaveMaterialDarkGateHandler = class LeaveMaterialDarkGateHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        openedDarkGate.delete(player);
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.LEAVE_DARKPORTAL));
    }
};
exports.LeaveMaterialDarkGateHandler = LeaveMaterialDarkGateHandler;
exports.LeaveMaterialDarkGateHandler = LeaveMaterialDarkGateHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.LEAVE_DARKPORTAL, decorators_1.InjectType.NONE)
], LeaveMaterialDarkGateHandler);
//# sourceMappingURL=MaterialHandlers.js.map