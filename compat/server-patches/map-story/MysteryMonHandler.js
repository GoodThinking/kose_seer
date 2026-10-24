"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { MaterialPacket } = require("./MaterialHandlers");
const { PacketEmpty } = require("../../Send/PacketEmpty");
const { GetStoryEncounter } = require("../../../../Game/Battle/StoryEncounters");

class MysteryMonHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 0 || player.Data.mapID !== 476 || player.Data.actionType === 1) {
            await player.SendPacket(new PacketEmpty(2614).setResult(5001));
            return;
        }
        await player.SendPacket(new MaterialPacket(2614, [GetStoryEncounter(player, 476, 0) ? 1 : 0]));
    }
}

Opcode(2614, InjectType.NONE)(MysteryMonHandler);
module.exports = { MysteryMonHandler };
