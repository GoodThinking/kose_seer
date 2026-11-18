"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetRelease = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetReleaseRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetReleaseRspProto");
/**
 * 释放精灵响应包
 * CMD 2304
 */
class PacketPetRelease extends BaseProto_1.BaseProto {
    _data;
    constructor(homeEnergy, firstPetTime, flag, petInfo, protocol = 'kose') {
        super(CommandID_1.CommandID.PET_RELEASE);
        const proto = new PetReleaseRspProto_1.PetReleaseRspProto();
        proto.homeEnergy = homeEnergy;
        proto.firstPetTime = firstPetTime;
        proto.flag = flag;
        if (petInfo) {
            proto.petInfo = petInfo;
        }
        this._data = proto.serialize(protocol);
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetRelease = PacketPetRelease;
//# sourceMappingURL=PacketPetRelease.js.map