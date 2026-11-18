"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetPetList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetPetListRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/GetPetListRspProto");
/**
 * 获取精灵列表响应包
 * CMD 2303
 */
class PacketGetPetList extends BaseProto_1.BaseProto {
    _data;
    constructor(pets, protocol = 'kose') {
        super(CommandID_1.CommandID.GET_PET_LIST);
        const proto = new GetPetListRspProto_1.GetPetListRspProto();
        proto.pets = pets;
        this._data = proto.serialize(protocol);
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetPetList = PacketGetPetList;
//# sourceMappingURL=PacketGetPetList.js.map