"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSkillSwitchRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2312] 精灵技能切换响应
 */
class PetSkillSwitchRspProto extends BaseProto_1.BaseProto {
    petId = 0; // 精灵ID
    constructor() {
        super(CommandID_1.CommandID.PET_SKILL_SWICTH);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(8);
        writer.WriteUInt32(this.result);
        writer.WriteUInt32(this.petId);
        return writer.ToBuffer();
    }
    setPetId(value) {
        this.petId = value;
        return this;
    }
}
exports.PetSkillSwitchRspProto = PetSkillSwitchRspProto;
//# sourceMappingURL=PetSkillSwitchRspProto.js.map