"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSkillSwitch = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetSkillSwitchRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetSkillSwitchRspProto");
/**
 * PET_SKILL_SWICTH 数据包 (2312)
 * 精灵技能切换响应
 */
class PacketSkillSwitch extends BaseProto_1.BaseProto {
    _data;
    constructor(petId) {
        super(CommandID_1.CommandID.PET_SKILL_SWICTH);
        const proto = new PetSkillSwitchRspProto_1.PetSkillSwitchRspProto();
        proto.petId = petId;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
    deserialize(_buffer) {
        // Not needed for response
    }
}
exports.PacketSkillSwitch = PacketSkillSwitch;
//# sourceMappingURL=PacketSkillSwitch.js.map