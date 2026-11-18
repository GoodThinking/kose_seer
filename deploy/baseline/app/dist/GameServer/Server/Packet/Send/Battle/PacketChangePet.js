"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketChangePet = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChangePetRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/ChangePetRspProto");
/**
 * 更换精灵包
 * CMD 2407
 */
class PacketChangePet extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, petId, petName, level, hp, maxHp, catchTime) {
        super(CommandID_1.CommandID.CHANGE_PET);
        const proto = new ChangePetRspProto_1.ChangePetRspProto();
        proto.setUserId(userId);
        proto.setPetId(petId);
        proto.setPetName(petName);
        proto.setLevel(level);
        proto.setHP(hp, maxHp);
        proto.setCatchTime(catchTime);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketChangePet = PacketChangePet;
//# sourceMappingURL=PacketChangePet.js.map