"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetGetExp = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetGetExpRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetGetExpRspProto");
/**
 * 获取精灵经验分配信息响应包
 * CMD 2319
 */
class PacketPetGetExp extends BaseProto_1.BaseProto {
    _data;
    constructor(allocatableExp) {
        super(CommandID_1.CommandID.PET_GET_EXP);
        const proto = new PetGetExpRspProto_1.PetGetExpRspProto(allocatableExp);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetGetExp = PacketPetGetExp;
//# sourceMappingURL=PacketPetGetExp.js.map