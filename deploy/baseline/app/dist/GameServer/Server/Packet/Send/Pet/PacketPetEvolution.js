"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetEvolution = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetEvolutionRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetEvolutionRspProto");
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化响应包
 */
class PacketPetEvolution extends BaseProto_1.BaseProto {
    _data;
    constructor(status = 0) {
        super(CommandID_1.CommandID.PET_EVOLVTION);
        const proto = new PetEvolutionRspProto_1.PetEvolutionRspProto(status);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetEvolution = PacketPetEvolution;
//# sourceMappingURL=PacketPetEvolution.js.map