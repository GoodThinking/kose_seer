"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSimUserInfoReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 获取简单用户信息请求
 * CMD: 2051 GET_SIM_USERINFO
 */
class GetSimUserInfoReqProto extends BaseProto_1.BaseProto {
    targetId = 0;
    constructor() {
        super(CommandID_1.CommandID.GET_SIM_USERINFO);
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
exports.GetSimUserInfoReqProto = GetSimUserInfoReqProto;
//# sourceMappingURL=GetSimUserInfoReqProto.js.map