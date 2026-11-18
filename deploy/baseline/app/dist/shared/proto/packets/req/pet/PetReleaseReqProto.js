"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetReleaseReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2304 PET_RELEASE] 释放精灵请求
 * Request: catchId(4) + flag(4)
 */
class PetReleaseReqProto extends BaseProto_1.BaseProto {
    catchId = 0; // 捕获ID
    flag = 0; // 标志
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PetReleaseReqProto();
        if (buffer.length >= 8) {
            proto.catchId = buffer.readUInt32BE(0);
            proto.flag = buffer.readUInt32BE(4);
        }
        return proto;
    }
}
exports.PetReleaseReqProto = PetReleaseReqProto;
//# sourceMappingURL=PetReleaseReqProto.js.map