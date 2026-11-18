"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketStudySkill = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetStudySkillRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/PetStudySkillRspProto");
/**
 * PET_STUDY_SKILL 数据包 (2307)
 * 精灵学习技能响应
 */
class PacketStudySkill extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.PET_STUDY_SKILL);
        const proto = new PetStudySkillRspProto_1.PetStudySkillRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
    deserialize(_buffer) {
        // Not needed for response
    }
}
exports.PacketStudySkill = PacketStudySkill;
//# sourceMappingURL=PacketStudySkill.js.map