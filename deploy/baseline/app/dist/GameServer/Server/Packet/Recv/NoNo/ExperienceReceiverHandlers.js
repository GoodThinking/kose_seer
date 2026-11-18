"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TalkCateHandler = exports.TalkCountHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const ExperienceReceiver_1 = require("../../../../Game/NoNo/ExperienceReceiver");
const SuperAnalyzer_1 = require("../../../../Game/NoNo/SuperAnalyzer");
const SuperNonoCoins_1 = require("../../../../Game/NoNo/SuperNonoCoins");
const Mining_1 = require("../../../../Game/Item/Mining");
const GachaTicket_1 = require("../../../../Game/Item/GachaTicket");
const utils_1 = require("../../../../../shared/utils");
class PacketReceiverCount extends BaseProto_1.BaseProto {
    count;
    constructor(count) {
        super(CommandID_1.CommandID.TALK_COUNT);
        this.count = count;
    }
    serialize() {
        const body = Buffer.alloc(4);
        body.writeUInt32BE(this.count);
        return body;
    }
}
class PacketReceiverReward extends BaseProto_1.BaseProto {
    rewards;
    constructor(rewards) {
        super(CommandID_1.CommandID.TALK_CATE);
        this.rewards = rewards;
    }
    serialize() {
        const body = Buffer.alloc(8 + this.rewards.length * 8);
        body.writeUInt32BE(this.rewards.length, 4);
        this.rewards.forEach((reward, index) => {
            body.writeUInt32BE(reward.itemId, 8 + index * 8);
            body.writeUInt32BE(reward.count, 12 + index * 8);
        });
        return body;
    }
}
let TalkCountHandler = class TalkCountHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 4) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_COUNT).setResult(5001));
            return;
        }
        try {
            const type = body.readUInt32BE(0);
            let count;
            if (type === 2001)
                count = await new SuperNonoCoins_1.SuperNonoCoins(player).Count();
            else if (type === 1004 || type === 2002)
                count = await new ExperienceReceiver_1.ExperienceReceiver(player).Count(type);
            else if (type === 1501 || type === 2101)
                count = await new SuperAnalyzer_1.SuperAnalyzer(player).Count(type);
            else if (type === 2051)
                count = await new GachaTicket_1.GachaTicket(player).Count();
            else
                count = await new Mining_1.Mining(player).Count(type);
            await player.SendPacket(new PacketReceiverCount(count));
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_COUNT).setResult(5001));
        }
    }
};
exports.TalkCountHandler = TalkCountHandler;
exports.TalkCountHandler = TalkCountHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.TALK_COUNT, decorators_1.InjectType.NONE)
], TalkCountHandler);
let TalkCateHandler = class TalkCateHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 4) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_CATE).setResult(5001));
            return;
        }
        let rewards;
        try {
            const type = body.readUInt32BE(0);
            if (type === 1004 || type === 2002) {
                // The original receiver reads count only; id 0 is its existing placeholder.
                rewards = [{ itemId: 0, count: await new ExperienceReceiver_1.ExperienceReceiver(player).Claim(type) }];
            }
            else if (type === 2001) {
                rewards = [{ itemId: 1, count: await new SuperNonoCoins_1.SuperNonoCoins(player).Claim() }];
            }
            else if (type === 1501 || type === 2101) {
                rewards = [await new SuperAnalyzer_1.SuperAnalyzer(player).Claim(type)];
            }
            else if (type === 2051) {
                rewards = [await new GachaTicket_1.GachaTicket(player).Claim()];
            }
            else
                rewards = await new Mining_1.Mining(player).Claim(type);
        }
        catch (error) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TALK_CATE).setResult(error instanceof ExperienceReceiver_1.ReceiverAlreadyClaimed || error instanceof SuperAnalyzer_1.AnalyzerAlreadyClaimed ||
                error instanceof GachaTicket_1.GachaTicketAlreadyClaimed ? 5002 : 5000));
            return;
        }
        try {
            await player.SendPacket(new PacketReceiverReward(rewards));
        }
        catch (error) {
            utils_1.Logger.Error('[TalkCate] Reward committed; response delivery failed', error instanceof Error ? error : new Error(String(error)));
        }
    }
};
exports.TalkCateHandler = TalkCateHandler;
exports.TalkCateHandler = TalkCateHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.TALK_CATE, decorators_1.InjectType.NONE)
], TalkCateHandler);
//# sourceMappingURL=ExperienceReceiverHandlers.js.map