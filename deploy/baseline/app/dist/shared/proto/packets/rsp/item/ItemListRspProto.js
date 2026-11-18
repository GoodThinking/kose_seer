"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 物品列表响应
 * CMD 2605
 */
class ItemListRspProto extends BaseProto_1.BaseProto {
    items;
    constructor(items) {
        super(CommandID_1.CommandID.ITEM_LIST);
        this.items = items;
    }
    serialize() {
        const buffer = Buffer.alloc(4 + this.items.length * 16);
        let offset = 0;
        buffer.writeUInt32BE(this.items.length, offset);
        offset += 4;
        for (const item of this.items) {
            buffer.writeUInt32BE(item.itemId, offset);
            offset += 4;
            buffer.writeUInt32BE(item.count, offset);
            offset += 4;
            buffer.writeUInt32BE(item.expireTime, offset);
            offset += 4;
            buffer.writeUInt32BE(item.unknown, offset);
            offset += 4;
        }
        return buffer;
    }
}
exports.ItemListRspProto = ItemListRspProto;
//# sourceMappingURL=ItemListRspProto.js.map