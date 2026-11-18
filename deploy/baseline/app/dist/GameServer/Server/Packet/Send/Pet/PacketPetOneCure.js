"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetOneCure = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetOneCureRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetOneCureRspProto");
/**
 * 恢复单个精灵HP包
 * CMD 2310
 */
class PacketPetOneCure extends BaseProto_1.BaseProto {
    _data;
    constructor(catchTime) {
        super(CommandID_1.CommandID.PET_ONE_CURE);
        const proto = new PetOneCureRspProto_1.PetOneCureRspProto();
        proto.setCatchTime(catchTime);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetOneCure = PacketPetOneCure;
//# sourceMappingURL=PacketPetOneCure.js.map