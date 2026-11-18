"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldBuyProductRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 使用金豆购买商品响应
 * CMD: 1104
 */
class GoldBuyProductRspProto extends BaseProto_1.BaseProto {
    unknown = 0;
    payGold = 0; // 花费的金豆 * 100
    gold = 0; // 剩余金豆 * 100
    constructor() {
        super(CommandID_1.CommandID.GOLD_BUY_PRODUCT);
    }
    serialize() {
        const buffer = Buffer.allocUnsafe(12);
        let offset = 0;
        // unknown (4 bytes BE)
        buffer.writeUInt32BE(this.unknown, offset);
        offset += 4;
        // payGold (4 bytes BE)
        buffer.writeUInt32BE(this.payGold, offset);
        offset += 4;
        // gold (4 bytes BE)
        buffer.writeUInt32BE(this.gold, offset);
        offset += 4;
        return buffer;
    }
    // 链式调用方法
    setUnknown(value) {
        this.unknown = value;
        return this;
    }
    setPayGold(value) {
        this.payGold = value;
        return this;
    }
    setGold(value) {
        this.gold = value;
        return this;
    }
}
exports.GoldBuyProductRspProto = GoldBuyProductRspProto;
//# sourceMappingURL=GoldBuyProductRspProto.js.map