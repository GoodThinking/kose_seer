"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { Logger } = require("../../../../../shared/utils/Logger");
const { PacketEmpty } = require("../../Send/PacketEmpty");
const { MaterialPacket } = require("./MaterialHandlers");
const { ForestMechanisms, ForestRequestError, SendForestAlert } = require("../../../../Game/Map/ForestMechanisms");

async function reject(player, command, error) {
    if (!(error instanceof ForestRequestError)) Logger.Error("[ForestMechanisms] Request failed", error);
    await SendForestAlert(player, error instanceof ForestRequestError ? error.message : "采集请求未完成，请先检查背包。");
    if (command === 2277) {
        // Native fruit UI expects an item ID or zero, including unsuccessful attempts.
        await player.SendPacket(new MaterialPacket(command, [0]));
    } else {
        // Zero is a valid Boss region; never turn missing configuration into a normal challenge.
        await player.SendPacket(new PacketEmpty(command).setResult(900));
    }
}

class ForestFruitHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 0) {
            await player.SendPacket(new PacketEmpty(2277).setResult(5001));
            return;
        }
        let itemId;
        try {
            itemId = await new ForestMechanisms(player).CollectFireFruit();
        } catch (error) {
            await reject(player, 2277, error);
            return;
        }
        try {
            await player.SendPacket(new MaterialPacket(2277, [itemId]));
        } catch (error) {
            Logger.Error("[ForestMechanisms] Attempt committed; response delivery failed", error);
        }
    }
}

class ForestFoxLevelHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 0) {
            await player.SendPacket(new PacketEmpty(2278).setResult(5001));
            return;
        }
        let region;
        try {
            region = new ForestMechanisms(player).GetFoxRegion();
        } catch (error) {
            await reject(player, 2278, error);
            return;
        }
        await player.SendPacket(new MaterialPacket(2278, [region]));
    }
}

Opcode(2277, InjectType.NONE)(ForestFruitHandler);
Opcode(2278, InjectType.NONE)(ForestFoxLevelHandler);
module.exports = { ForestFruitHandler, ForestFoxLevelHandler };
