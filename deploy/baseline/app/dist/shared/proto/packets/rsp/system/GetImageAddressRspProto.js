"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetImageAddressRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 1005 GET_IMAGE_ADDRESS] 获取图片服务器地址响应
 */
class GetImageAddressRspProto extends BaseProto_1.BaseProto {
    ip = '127.0.0.1'; // IP地址
    port = 80; // 端口
    session = ''; // 会话
    constructor() {
        super(CommandID_1.CommandID.GET_IMAGE_ADDRESS);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(34);
        writer.WriteBytes(this.buildString(this.ip, 16));
        writer.WriteUInt16(this.port);
        writer.WriteBytes(this.buildString(this.session, 16));
        return writer.ToBuffer();
    }
    setIp(ip) {
        this.ip = ip;
        return this;
    }
    setPort(port) {
        this.port = port;
        return this;
    }
    setSession(session) {
        this.session = session;
        return this;
    }
}
exports.GetImageAddressRspProto = GetImageAddressRspProto;
//# sourceMappingURL=GetImageAddressRspProto.js.map