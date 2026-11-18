"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMoreUserInfoReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2052] 获取更多用户信息请求
 *
 * 请求格式：
 * - userId: uint32 (要查询的用户ID)
 */
class GetMoreUserInfoReqProto extends BaseProto_1.BaseProto {
    userId = 0;
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new GetMoreUserInfoReqProto();
        if (buffer.length >= 4) {
            proto.userId = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.GetMoreUserInfoReqProto = GetMoreUserInfoReqProto;
//# sourceMappingURL=GetMoreUserInfoReqProto.js.map