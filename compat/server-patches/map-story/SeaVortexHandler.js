"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { Logger } = require("../../../../../shared/utils/Logger");
const { PacketEmpty } = require("../../Send/PacketEmpty");
const { MaterialPacket } = require("./MaterialHandlers");
const { SendForestAlert } = require("../../../../Game/Map/ForestMechanisms");
const { SeaVortexError, GetSeaState, ResolveSeaRescue } = require("../../../../Game/Map/SeaVortexActivity");
const rules = require("../../../../../../config/data/json/sea_vortex.json");

class SeaVortexHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 8) {
            await player.SendPacket(new PacketEmpty(rules.command).setResult(5001));
            return;
        }
        const action = body.readUInt32BE(0), slot = body.readUInt32BE(4);
        let state;
        try {
            if (action === 0 && slot === 0) state = await GetSeaState(player);
            else if (action === 1 && slot <= 2) state = await ResolveSeaRescue(player, slot);
            else throw new SeaVortexError("请通过神殿场景中的原生机关参与救援。");
        } catch (error) {
            if (!(error instanceof SeaVortexError)) Logger.Error("[SeaVortex] Request failed", error);
            await SendForestAlert(player, error instanceof SeaVortexError ? error.message : "救援进度未完成保存，请稍后重新与场景目标交谈。");
            await player.SendPacket(new MaterialPacket(rules.command, [2, 0, 0, 0, 0xffffffff, 0, 0, 0]));
            return;
        }
        // A lost response must not repeat a committed reward. A later query reads the saved state.
        try {
            await player.SendPacket(new MaterialPacket(rules.command, [action, state.shots, state.run, state.pk, state.pendingSlot, state.petId, state.region, state.itemId || 0]));
        } catch (error) {
            Logger.Error("[SeaVortex] State committed; response delivery failed", error);
        }
    }
}
Opcode(rules.command, InjectType.NONE)(SeaVortexHandler);
module.exports = { SeaVortexHandler };
