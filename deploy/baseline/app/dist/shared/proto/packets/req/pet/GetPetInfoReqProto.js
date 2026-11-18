"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetPetInfoReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2301 GET_PET_INFO] 获取精灵信息请求
 */
class GetPetInfoReqProto extends BaseProto_1.BaseProto {
    catchTime = 0; // 捕获时间（精灵唯一标识）
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new GetPetInfoReqProto();
        if (buffer.length >= 4) {
            proto.catchTime = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.GetPetInfoReqProto = GetPetInfoReqProto;
//# sourceMappingURL=GetPetInfoReqProto.js.map