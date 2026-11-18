"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGoldBuyProduct = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GoldBuyProductRspProto_1 = require("../../../../../shared/proto/packets/rsp/user/GoldBuyProductRspProto");
const GoldCurrency_1 = require("../../../../../shared/protocol/GoldCurrency");
/**
 * 使用金豆购买商品响应包
 * CMD 1104
 */
class PacketGoldBuyProduct extends BaseProto_1.BaseProto {
    _data;
    constructor(payGold, remainingGold) {
        super(CommandID_1.CommandID.GOLD_BUY_PRODUCT);
        const proto = new GoldBuyProductRspProto_1.GoldBuyProductRspProto();
        proto.setUnknown(0);
        proto.setPayGold(payGold);
        proto.setGold(remainingGold);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGoldBuyProduct = PacketGoldBuyProduct;
//# sourceMappingURL=PacketGoldBuyProduct.js.map