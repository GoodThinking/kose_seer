"use strict";
const { Opcode, InjectType } = require('../../../../../shared/decorators');
const { CommandID } = require('../../../../../shared/protocol/CommandID');
const { BaseProto } = require('../../../../../shared/proto/base/BaseProto');
const { PacketEmpty } = require('../../Send/PacketEmpty');
const { Grant, MapFitmentAlreadyOwned } = require('../../../../Game/Item/MapFitmentRewards');
const { Logger } = require('../../../../../shared/utils');

class PacketMapFitment extends BaseProto {
    constructor(coins, itemId, count) { super(CommandID.BUY_FITMENT); this.coins = coins; this.itemId = itemId; this.count = count; }
    serialize() {
        const body = Buffer.alloc(12);
        body.writeUInt32BE(this.coins, 0);
        body.writeUInt32BE(this.itemId, 4);
        body.writeUInt32BE(this.count, 8);
        return body;
    }
}
class MapFitmentHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player || player.Session !== session) return;
        let reward;
        try {
            if (body.length !== 8) throw new Error('Invalid map furniture request');
            reward = await Grant(player, body.readUInt32BE(0), body.readUInt32BE(4));
        } catch (error) {
            Logger.Error('[MapFitmentHandler] Furniture request rejected', error);
            if (player.Session === session && !session.Socket.destroyed)
                await player.SendPacket(new PacketEmpty(CommandID.BUY_FITMENT).setResult(error instanceof MapFitmentAlreadyOwned ? 103240 : 5001));
            return;
        }
        if (player.Session !== session || session.Socket.destroyed) return;
        try {
            // The native listener reads but does not use the third word; send the actual granted count.
            await player.SendPacket(new PacketMapFitment(player.Data.coins, reward.itemId, reward.count));
        } catch (error) {
            Logger.Error('[MapFitmentHandler] Furniture committed; response delivery failed', error);
        }
    }
}
Opcode(CommandID.BUY_FITMENT, InjectType.NONE)(MapFitmentHandler);
module.exports = { MapFitmentHandler };
