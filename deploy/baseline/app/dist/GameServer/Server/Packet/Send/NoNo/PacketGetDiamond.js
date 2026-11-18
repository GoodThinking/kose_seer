"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetDiamond = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const GetDiamondRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/GetDiamondRspProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * 获取钻石数量响应包
 */
class PacketGetDiamond extends BaseProto_1.BaseProto {
    _data;
    constructor(diamondCount) {
        super(CommandID_1.CommandID.GET_DIAMOND);
        const proto = new GetDiamondRspProto_1.GetDiamondRspProto().setDiamondCount(diamondCount);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetDiamond = PacketGetDiamond;
//# sourceMappingURL=PacketGetDiamond.js.map