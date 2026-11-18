"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeeOnlineReqProto = void 0;
const protocol_1 = require("../../../../protocol");
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2157 SEE_ONLINE] 查看在线状态请求
 *
 * 请求格式:
 * - count (uint32) - 用户数量
 * - userIds (uint32[]) - 用户ID列表
 */
class SeeOnlineReqProto extends BaseProto_1.BaseProto {
    count = 0;
    userIds = [];
    constructor() {
        super(protocol_1.CommandID.SEE_ONLINE);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new SeeOnlineReqProto();
        if (buffer.length >= 4) {
            proto.count = buffer.readUInt32BE(0);
            proto.userIds = [];
            for (let i = 0; i < proto.count; i++) {
                const offset = 4 + i * 4;
                if (buffer.length >= offset + 4) {
                    proto.userIds.push(buffer.readUInt32BE(offset));
                }
            }
        }
        return proto;
    }
}
exports.SeeOnlineReqProto = SeeOnlineReqProto;
//# sourceMappingURL=SeeOnlineReqProto.js.map