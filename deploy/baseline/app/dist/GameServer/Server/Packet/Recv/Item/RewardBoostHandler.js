"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardBoostStatusHandler = exports.RewardBoostUseHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const RewardBoost_1 = require("../../../../Game/Reward/RewardBoost");
const PacketRewardBoost_1 = require("../../Send/Item/PacketRewardBoost");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const utils_1 = require("../../../../../shared/utils");
let RewardBoostUseHandler = class RewardBoostUseHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 4) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.REWARD_BOOST_USE).setResult(5001));
            return;
        }
        try {
            const result = await (0, RewardBoost_1.UseRewardBoost)(player, body.readUInt32BE(0));
            await player.SendPacket(new PacketRewardBoost_1.PacketRewardBoost(CommandID_1.CommandID.REWARD_BOOST_USE, [result.itemId, result.remainingCount, result.expiresAt, result.now]));
        }
        catch (error) {
            utils_1.Logger.Error('[RewardBoost] Item use failed', error instanceof Error ? error : new Error(String(error)));
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.REWARD_BOOST_USE).setResult(error instanceof RewardBoost_1.RewardBoostError ? error.code : 5000));
        }
    }
};
exports.RewardBoostUseHandler = RewardBoostUseHandler;
exports.RewardBoostUseHandler = RewardBoostUseHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.REWARD_BOOST_USE, decorators_1.InjectType.NONE)
], RewardBoostUseHandler);
let RewardBoostStatusHandler = class RewardBoostStatusHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 0) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.REWARD_BOOST_STATUS).setResult(5001));
            return;
        }
        try {
            const status = await (0, RewardBoost_1.GetRewardBoostStatus)(player.Uid);
            await player.SendPacket(new PacketRewardBoost_1.PacketRewardBoost(CommandID_1.CommandID.REWARD_BOOST_STATUS, [status.now, status.experience.expiresAt, status.learning.expiresAt, status.coins.expiresAt]));
        }
        catch (error) {
            utils_1.Logger.Error('[RewardBoost] Status query failed', error instanceof Error ? error : new Error(String(error)));
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.REWARD_BOOST_STATUS).setResult(5000));
        }
    }
};
exports.RewardBoostStatusHandler = RewardBoostStatusHandler;
exports.RewardBoostStatusHandler = RewardBoostStatusHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.REWARD_BOOST_STATUS, decorators_1.InjectType.NONE)
], RewardBoostStatusHandler);
//# sourceMappingURL=RewardBoostHandler.js.map