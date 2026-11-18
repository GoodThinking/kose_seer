"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldBuyProductReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 使用金豆购买商品请求
 * CMD: 1104
 */
class GoldBuyProductReqProto extends BaseProto_1.BaseProto {
    productId = 0;
    count = 0;
    constructor() {
        super(CommandID_1.CommandID.GOLD_BUY_PRODUCT);
    }
    deserialize(buffer) {
        let offset = 0;
        // productId (4 bytes BE)
        this.productId = buffer.readUInt32BE(offset);
        offset += 4;
        // count (2 bytes BE)
        this.count = buffer.readUInt16BE(offset);
        offset += 2;
    }
    serialize() {
        // Request proto 不需要序列化
        return Buffer.alloc(0);
    }
}
exports.GoldBuyProductReqProto = GoldBuyProductReqProto;
//# sourceMappingURL=GoldBuyProductReqProto.js.map