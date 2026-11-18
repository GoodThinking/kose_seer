"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetPetSkill = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetPetSkillRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/GetPetSkillRspProto");
/**
 * 获取精灵技能响应包
 * CMD: 2336
 */
class PacketGetPetSkill extends BaseProto_1.BaseProto {
    _data;
    constructor(skills) {
        super(CommandID_1.CommandID.GET_PET_SKILL);
        const proto = new GetPetSkillRspProto_1.GetPetSkillRspProto(CommandID_1.CommandID.GET_PET_SKILL);
        proto.skills = skills;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetPetSkill = PacketGetPetSkill;
//# sourceMappingURL=PacketGetPetSkill.js.map