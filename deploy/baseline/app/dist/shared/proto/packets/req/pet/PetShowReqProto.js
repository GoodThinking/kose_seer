"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetShowReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2305 PET_SHOW] 展示精灵请求
 * Request: catchTime(4) + flag(4)
 */
class PetShowReqProto extends BaseProto_1.BaseProto {
    catchTime = 0; // 捕获时间
    flag = 0; // 标志
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetShowReqProto();
        if (buffer.length >= 8) {
            proto.catchTime = buffer.readUInt32BE(0);
            proto.flag = buffer.readUInt32BE(4);
        }
        return proto;
    }
}
exports.PetShowReqProto = PetShowReqProto;
//# sourceMappingURL=PetShowReqProto.js.map