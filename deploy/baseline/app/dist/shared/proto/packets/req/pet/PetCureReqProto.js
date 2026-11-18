"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetCureReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2306 PET_CURE] 治疗精灵请求
 */
class PetCureReqProto extends BaseProto_1.BaseProto {
    cureType = 0; // 治疗类型 (0=全部, 1=单个)
    catchTime = 0; // 捕获时间（单个治疗时）
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetCureReqProto();
        if (buffer.length >= 8) {
            proto.cureType = buffer.readUInt32BE(0);
            proto.catchTime = buffer.readUInt32BE(4);
        }
        return proto;
    }
}
exports.PetCureReqProto = PetCureReqProto;
//# sourceMappingURL=PetCureReqProto.js.map