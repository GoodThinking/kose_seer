"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetPetInfo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetPetInfoRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/GetPetInfoRspProto");
/**
 * 获取精灵信息响应包
 * CMD 2301
 */
class PacketGetPetInfo extends BaseProto_1.BaseProto {
    _data;
    constructor(petInfo, result = 0, protocol = 'kose') {
        super(CommandID_1.CommandID.GET_PET_INFO);
        const proto = new GetPetInfoRspProto_1.GetPetInfoRspProto();
        if (petInfo) {
            proto.petInfo = petInfo;
        }
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize(protocol);
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetPetInfo = PacketGetPetInfo;
//# sourceMappingURL=PacketGetPetInfo.js.map