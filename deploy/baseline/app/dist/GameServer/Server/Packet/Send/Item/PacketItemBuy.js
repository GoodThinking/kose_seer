"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketItemBuy = void 0;
const ItemBuyRspProto_1 = require("../../../../../shared/proto/packets/rsp/item/ItemBuyRspProto");
/**
 * 物品购买/获得数据包
 * CommandID: ITEM_BUY (2601)
 *
 * 直接返回Proto对象，由SendPacket处理
 */
class PacketItemBuy extends ItemBuyRspProto_1.ItemBuyRspProto {
    constructor(cash, itemID, itemNum, itemLevel) {
        super(cash, itemID, itemNum, itemLevel);
    }
}
exports.PacketItemBuy = PacketItemBuy;
//# sourceMappingURL=PacketItemBuy.js.map