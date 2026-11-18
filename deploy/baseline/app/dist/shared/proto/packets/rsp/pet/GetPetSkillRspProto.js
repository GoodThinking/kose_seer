"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetSkillRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * 获取精灵技能响应
 * CMD: 2336
 *
 * 协议格式：
 * - skillCount (4 bytes) - 技能数量
 * - skillId[] (4 bytes each) - 技能ID列表
 */
class GetPetSkillRspProto extends BaseProto_1.BaseProto {
    skills = [];
    serialize() {
        const buffers = [];
        // 技能数量 (4 bytes)
        const skillCountBuffer = Buffer.allocUnsafe(4);
        skillCountBuffer.writeUInt32BE(this.skills.length, 0);
        buffers.push(skillCountBuffer);
        // 技能ID列表
        for (const skillId of this.skills) {
            const skillIdBuffer = Buffer.allocUnsafe(4);
            skillIdBuffer.writeUInt32BE(skillId, 0);
            buffers.push(skillIdBuffer);
        }
        return Buffer.concat(buffers);
    }
}
exports.GetPetSkillRspProto = GetPetSkillRspProto;
//# sourceMappingURL=GetPetSkillRspProto.js.map