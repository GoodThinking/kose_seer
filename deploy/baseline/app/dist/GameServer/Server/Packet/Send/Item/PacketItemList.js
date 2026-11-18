"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketItemList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ItemListRspProto_1 = require("../../../../../shared/proto/packets/rsp/item/ItemListRspProto");
/**
 * 物品列表响应包
 * CMD 2605
 */
class PacketItemList extends BaseProto_1.BaseProto {
    _data;
    constructor(items) {
        super(CommandID_1.CommandID.ITEM_LIST);
        const proto = new ItemListRspProto_1.ItemListRspProto(items);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketItemList = PacketItemList;
//# sourceMappingURL=PacketItemList.js.map