"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetSkillReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * 获取精灵技能请求
 * CMD: 2336
 */
class GetPetSkillReqProto extends BaseProto_1.BaseProto {
    catchTime = 0;
    deserialize(buffer) {
        let offset = 0;
        this.catchTime = buffer.readUInt32BE(offset);
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.GetPetSkillReqProto = GetPetSkillReqProto;
//# sourceMappingURL=GetPetSkillReqProto.js.map