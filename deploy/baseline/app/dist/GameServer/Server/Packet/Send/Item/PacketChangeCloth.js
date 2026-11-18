"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketChangeCloth = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChangeClothRspProto_1 = require("../../../../../shared/proto/packets/rsp/item/ChangeClothRspProto");
/**
 * 更换服装响应包
 * CMD 2604
 */
class PacketChangeCloth extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, clothIds) {
        super(CommandID_1.CommandID.CHANGE_CLOTH);
        const proto = new ChangeClothRspProto_1.ChangeClothRspProto(userId, clothIds);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketChangeCloth = PacketChangeCloth;
//# sourceMappingURL=PacketChangeCloth.js.map