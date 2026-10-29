"use strict";
const {Opcode, InjectType} = require("../../../../../shared/decorators/Opcode");
const {Logger} = require("../../../../../shared/utils/Logger");
const {PacketEmpty} = require("../../Send/PacketEmpty");
const {MaterialPacket} = require("./MaterialHandlers");
const {SendForestAlert} = require("../../../../Game/Map/ForestMechanisms");
const {ClosedSpaceError, ClaimClosedSpaceTreasure} = require("../../../../Game/Map/ClosedSpaceTreasure");
const {command} = require("../../../../../../config/data/json/closed_space.json");
class ClosedSpaceTreasureHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 4) {
            await player.SendPacket(new PacketEmpty(command).setResult(5001));
            return;
        }
        const prizeIndex = body.readUInt32BE(0);
        let result;
        try {
            result = await ClaimClosedSpaceTreasure(player, prizeIndex);
        } catch (error) {
            if (!(error instanceof ClosedSpaceError)) Logger.Error("[ClosedSpaceTreasure] Claim failed", error);
            await SendForestAlert(player, error instanceof ClosedSpaceError ? error.message : "宝箱奖励未完成保存，请稍后重试；未提交的领取不会扣除机会。");
            await player.SendPacket(new PacketEmpty(command).setResult(5001));
            return;
        }
        // AresiaSpacePrize: bonus index, pet id, catch time, item count, item pairs.
        const fields = [prizeIndex, 0, 0, result.reward ? 1 : 0];
        if (result.reward) fields.push(result.reward.itemId, result.reward.count);
        try {
            await player.SendPacket(new MaterialPacket(command, fields));
            if (result.alreadyClaimed) await SendForestAlert(player, "这个房间的宝箱补给已经领取过了；其他机关和通路仍可正常使用。");
        } catch (error) {
            Logger.Error("[ClosedSpaceTreasure] Claim committed; response delivery failed", error);
        }
    }
}
Opcode(command, InjectType.NONE)(ClosedSpaceTreasureHandler);
module.exports = {ClosedSpaceTreasureHandler};
