"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMoneyBuyProduct = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/** 1102 now reports spent and remaining Seer coins as integer units. */
class PacketMoneyBuyProduct extends BaseProto_1.BaseProto {
    spentCoins;
    coins;
    constructor(spentCoins, coins) {
        super(CommandID_1.CommandID.MONEY_BUY_PRODUCT);
        this.spentCoins = spentCoins;
        this.coins = coins;
    }
    serialize() {
        const body = Buffer.alloc(12);
        body.writeUInt32BE(0, 0);
        body.writeUInt32BE(this.spentCoins, 4);
        body.writeUInt32BE(this.coins, 8);
        return body;
    }
}
exports.PacketMoneyBuyProduct = PacketMoneyBuyProduct;
//# sourceMappingURL=PacketMoneyBuyProduct.js.map