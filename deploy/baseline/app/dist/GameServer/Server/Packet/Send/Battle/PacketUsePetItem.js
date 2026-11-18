"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketUsePetItem = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const UsePetItemRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/UsePetItemRspProto");
/**
 * 使用精灵道具包
 * CMD 2406
 */
class PacketUsePetItem extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, itemId, hp, change) {
        super(CommandID_1.CommandID.USE_PET_ITEM);
        const proto = new UsePetItemRspProto_1.UsePetItemRspProto();
        proto.setUserId(userId);
        proto.setItemId(itemId);
        proto.setHP(hp, change);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketUsePetItem = PacketUsePetItem;
//# sourceMappingURL=PacketUsePetItem.js.map