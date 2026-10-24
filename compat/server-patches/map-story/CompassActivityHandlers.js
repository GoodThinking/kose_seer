"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { CommandID } = require("../../../../../shared/protocol/CommandID");
const { Logger } = require("../../../../../shared/utils/Logger");
const { PacketEmpty } = require("../../Send/PacketEmpty");
const { PacketItemBuy } = require("../../Send/Item/PacketItemBuy");
const { MaterialPacket } = require("./MaterialHandlers");
const { CompassActivity, CompassAlreadyClaimed } = require("../../../../Game/Map/CompassActivity");

async function rejectClaim(player, command, error) {
    if (!(error instanceof CompassAlreadyClaimed)) {
        Logger.Error(`[CompassActivity] Claim failed: uid=${player.Uid}, command=${command}`, error);
    }
    await player.SendPacket(new PacketEmpty(command).setResult(error instanceof CompassAlreadyClaimed ? 5002 : 5000));
}

class CompassExperienceHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        const command = CommandID.GET_NONOPARTY_EXP;
        if (body.length !== 0) {
            await player.SendPacket(new PacketEmpty(command).setResult(5001));
            return;
        }
        let experience;
        try {
            experience = await new CompassActivity(player).ClaimExperience();
        } catch (error) {
            await rejectClaim(player, command, error);
            return;
        }
        try {
            await player.SendPacket(new MaterialPacket(command, [experience]));
        } catch (error) {
            Logger.Error('[CompassActivity] Experience committed; response delivery failed', error);
        }
    }
}

class CompassItemHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        const command = CommandID.GET_NONOPARTY_ITEM;
        if (body.length !== 4 || (body.readUInt32BE(0) !== 1 && body.readUInt32BE(0) !== 2)) {
            await player.SendPacket(new PacketEmpty(command).setResult(5001));
            return;
        }
        let reward;
        try {
            reward = await new CompassActivity(player).ClaimItem(body.readUInt32BE(0));
        } catch (error) {
            await rejectClaim(player, command, error);
            return;
        }
        try {
            await player.SendPacket(new PacketEmpty(command));
            // The original compass does not listen for 9033; its global item listener displays grants.
            await player.SendPacket(new PacketItemBuy(player.Data.coins, reward.itemId, reward.count, 0));
        } catch (error) {
            Logger.Error('[CompassActivity] Item committed; response delivery failed', error);
        }
    }
}

Opcode(CommandID.GET_NONOPARTY_EXP, InjectType.NONE)(CompassExperienceHandler);
Opcode(CommandID.GET_NONOPARTY_ITEM, InjectType.NONE)(CompassItemHandler);
module.exports = { CompassExperienceHandler, CompassItemHandler };
