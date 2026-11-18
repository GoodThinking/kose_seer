"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoFollowOrHoomReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家请求
 */
class NoNoFollowOrHoomReqProto extends BaseProto_1.BaseProto {
    action = 0; // 0=回家, 1=跟随
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new NoNoFollowOrHoomReqProto();
        if (buffer.length >= 4) {
            proto.action = buffer.readUInt32BE(0);
        }
        return proto;
    }
}
exports.NoNoFollowOrHoomReqProto = NoNoFollowOrHoomReqProto;
//# sourceMappingURL=NoNoFollowOrHoomReqProto.js.map