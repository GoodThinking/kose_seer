"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemBuyReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 购买物品请求
 * CMD 2601
 */
class ItemBuyReqProto extends BaseProto_1.BaseProto {
    itemId = 0;
    count = 1;
    constructor() {
        super(CommandID_1.CommandID.ITEM_BUY);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.itemId = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 8) {
            this.count = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.ItemBuyReqProto = ItemBuyReqProto;
//# sourceMappingURL=ItemBuyReqProto.js.map