"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMoreUserInfoReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取详细用户信息请求
 * CMD: 2052 GET_MORE_USERINFO
 */
class GetMoreUserInfoReqProto extends BaseProto_1.BaseProto {
    targetId = 0;
    constructor() {
        super(CommandID_1.CommandID.GET_MORE_USERINFO);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.targetId = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.targetId, 0);
        return buffer;
    }
}
exports.GetMoreUserInfoReqProto = GetMoreUserInfoReqProto;
//# sourceMappingURL=GetMoreUserInfoReqProto.js.map