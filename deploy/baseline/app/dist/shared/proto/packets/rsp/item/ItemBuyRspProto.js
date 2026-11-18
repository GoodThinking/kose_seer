"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemBuyRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 物品购买/获得响应协议
 * CommandID: ITEM_BUY (2601)
 *
 * 用途：
 * 1. 购买物品后的响应
 * 2. 战斗掉落物品的通知
 * 3. 任务奖励物品的通知
 */
class ItemBuyRspProto extends BaseProto_1.BaseProto {
    cash = 0; // 当前金币
    itemID = 0; // 物品ID
    itemNum = 0; // 物品数量
    itemLevel = 0; // 物品等级
    constructor(cash = 0, itemID = 0, itemNum = 0, itemLevel = 0) {
        super(CommandID_1.CommandID.ITEM_BUY);
        this.cash = cash;
        this.itemID = itemID;
        this.itemNum = itemNum;
        this.itemLevel = itemLevel;
    }
    serialize(protocol = 'kose') {
        const buffer = Buffer.alloc(16);
        if (protocol === 'kose') {
            buffer.writeUInt32BE(this.cash, 0);
            buffer.writeUInt32BE(this.itemID, 4);
            buffer.writeUInt32BE(this.itemNum, 8);
            buffer.writeUInt32BE(this.itemLevel, 12);
        }
        else {
            buffer.writeUInt32LE(this.cash, 0);
            buffer.writeUInt32LE(this.itemID, 4);
            buffer.writeUInt32LE(this.itemNum, 8);
            buffer.writeUInt32LE(this.itemLevel, 12);
        }
        return buffer;
    }
}
exports.ItemBuyRspProto = ItemBuyRspProto;
//# sourceMappingURL=ItemBuyRspProto.js.map