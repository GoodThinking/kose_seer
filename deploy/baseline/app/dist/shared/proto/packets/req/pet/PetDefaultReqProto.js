"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetDefaultReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2308 PET_DEFAULT] 设置默认精灵请求
 */
class PetDefaultReqProto extends BaseProto_1.BaseProto {
    catchTime = 0; // 捕获时间
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetDefaultReqProto();
        if (buffer.length >= 4) {
            proto.catchTime = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.PetDefaultReqProto = PetDefaultReqProto;
//# sourceMappingURL=PetDefaultReqProto.js.map