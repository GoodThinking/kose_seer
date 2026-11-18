"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetSkillSwitchReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2312] 精灵技能切换请求
 *
 * 协议格式：
 * - catchTime (4 bytes) - 精灵捕获时间
 * - slot1 (4 bytes) - 技能槽位1 (0-3)
 * - slot2 (4 bytes) - 技能槽位2 (0-3)
 * - oldSkillId (4 bytes) - 旧技能ID
 * - newSkillId (4 bytes) - 新技能ID
 */
class PetSkillSwitchReqProto extends BaseProto_1.BaseProto {
    catchTime = 0;
    slot1 = 0;
    slot2 = 0;
    oldSkillId = 0;
    newSkillId = 0;
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetSkillSwitchReqProto();
        if (buffer.length >= 20) {
            proto.catchTime = buffer.readUInt32BE(0);
            proto.slot1 = buffer.readUInt32BE(4);
            proto.slot2 = buffer.readUInt32BE(8);
            proto.oldSkillId = buffer.readUInt32BE(12);
            proto.newSkillId = buffer.readUInt32BE(16);
        }
        return proto;
    }
}
exports.PetSkillSwitchReqProto = PetSkillSwitchReqProto;
//# sourceMappingURL=PetSkillSwitchReqProto.js.map