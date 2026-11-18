"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetSoulBeadList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetSoulBeadListRspProto_1 = require("../../../../../shared/proto/packets/rsp/soulbead/GetSoulBeadListRspProto");
/**
 * 获取魂珠列表响应包
 * CMD 2354: GET_SOUL_BEAD_List
 */
class PacketGetSoulBeadList extends BaseProto_1.BaseProto {
    _data;
    constructor(soulBeadList, result = 0) {
        super(CommandID_1.CommandID.GET_SOUL_BEAD_List);
        const proto = new GetSoulBeadListRspProto_1.GetSoulBeadListRspProto(soulBeadList);
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetSoulBeadList = PacketGetSoulBeadList;
//# sourceMappingURL=PacketGetSoulBeadList.js.map