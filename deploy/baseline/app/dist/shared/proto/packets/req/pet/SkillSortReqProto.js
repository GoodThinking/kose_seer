"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillSortReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2328 Skill_Sort] 技能排序请求
 *
 * 请求格式：
 * - catchTime (uint32): 精灵捕获时间
 * - skill1 (uint32): 技能槽1的技能ID
 * - skill2 (uint32): 技能槽2的技能ID
 * - skill3 (uint32): 技能槽3的技能ID
 * - skill4 (uint32): 技能槽4的技能ID
 */
class SkillSortReqProto extends BaseProto_1.BaseProto {
    catchTime = 0;
    skill1 = 0;
    skill2 = 0;
    skill3 = 0;
    skill4 = 0;
    constructor() {
        super(0);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.catchTime = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 8) {
            this.skill1 = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 12) {
            this.skill2 = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 16) {
            this.skill3 = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 20) {
            this.skill4 = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
    getSkillArray() {
        return [this.skill1, this.skill2, this.skill3, this.skill4].filter(id => id > 0);
    }
}
exports.SkillSortReqProto = SkillSortReqProto;
//# sourceMappingURL=SkillSortReqProto.js.map