"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldOnlineCheckRemainRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 金豆余额及 KOSE 金币读回
 */
class GoldOnlineCheckRemainRspProto extends BaseProto_1.BaseProto {
    gold = 0; // 金豆百分单位
    coins = 0;
    constructor() {
        super(CommandID_1.CommandID.GOLD_ONLINE_CHECK_REMAIN);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(protocol === 'kose' ? 8 : 4);
        writer.WriteUInt32(this.gold);
        if (protocol === 'kose')
            writer.WriteUInt32(this.coins);
        return writer.ToBuffer();
    }
    setGold(gold) {
        this.gold = gold;
        return this;
    }
    setCoins(coins) {
        if (!Number.isSafeInteger(coins) || coins < 0 || coins > 0xffffffff) {
            throw new Error('Coins cannot be encoded as uint32');
        }
        this.coins = coins;
        return this;
    }
}
exports.GoldOnlineCheckRemainRspProto = GoldOnlineCheckRemainRspProto;
//# sourceMappingURL=GoldOnlineCheckRemainRspProto.js.map