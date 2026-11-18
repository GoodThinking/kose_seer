"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketPetShow = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetShowRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetShowRspProto");
/**
 * 展示精灵响应包
 * CMD 2305
 */
class PacketPetShow extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, catchTime, petId, flag, dv, skinId) {
        super(CommandID_1.CommandID.PET_SHOW);
        const proto = new PetShowRspProto_1.PetShowRspProto();
        proto.userId = userId;
        proto.catchTime = catchTime;
        proto.petId = petId;
        proto.flag = flag;
        proto.dv = dv;
        proto.skinId = skinId;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketPetShow = PacketPetShow;
//# sourceMappingURL=PacketPetShow.js.map