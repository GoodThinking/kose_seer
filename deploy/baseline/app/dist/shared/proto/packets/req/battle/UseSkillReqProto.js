"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseSkillReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2405 USE_SKILL] 使用技能请求
 */
class UseSkillReqProto extends BaseProto_1.BaseProto {
    skillId = 0; // 技能ID
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new UseSkillReqProto();
        if (buffer.length >= 4) {
            proto.skillId = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.UseSkillReqProto = UseSkillReqProto;
//# sourceMappingURL=UseSkillReqProto.js.map