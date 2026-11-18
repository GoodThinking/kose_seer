"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemListReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 物品列表请求
 * CMD 2605
 */
class ItemListReqProto extends BaseProto_1.BaseProto {
    itemType1 = 0; // 范围起始
    itemType2 = 0; // 范围结束
    itemType3 = 0; // 单个物品ID
    constructor() {
        super(CommandID_1.CommandID.ITEM_LIST);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 12) {
            this.itemType1 = buffer.readUInt32BE(offset);
            offset += 4;
            this.itemType2 = buffer.readUInt32BE(offset);
            offset += 4;
            this.itemType3 = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.ItemListReqProto = ItemListReqProto;
//# sourceMappingURL=ItemListReqProto.js.map