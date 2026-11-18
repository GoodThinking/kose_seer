"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetCure = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetCureRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetCureRspProto");
/**
 * 治疗精灵响应包
 * CMD 2306
 */
class PacketPetCure extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.PET_CURE);
        const proto = new PetCureRspProto_1.PetCureRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetCure = PacketPetCure;
//# sourceMappingURL=PacketPetCure.js.map