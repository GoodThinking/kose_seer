"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRoomAddressRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 10002 GET_ROOM_ADDRES] 获取房间地址响应
 *
 * 响应格式:
 * - session: Buffer (24字节，会话信息)
 * - ip: uint32 (房间服务器IP，十六进制格式)
 * - port: uint16 (房间服务器端口)
 */
class GetRoomAddressRspProto extends BaseProto_1.BaseProto {
    session = Buffer.alloc(24);
    ip = 0;
    port = 0;
    constructor() {
        super(CommandID_1.CommandID.GET_ROOM_ADDRES);
    }
    serialize() {
        const buffer = Buffer.alloc(30); // 24 + 4 + 2
        let offset = 0;
        // 写入session (24字节)
        this.session.copy(buffer, offset, 0, 24);
        offset += 24;
        // 写入IP (4字节)
        buffer.writeUInt32BE(this.ip, offset);
        offset += 4;
        // 写入端口 (2字节)
        buffer.writeUInt16BE(this.port, offset);
        return buffer;
    }
    setAddress(session, ip, port) {
        this.session = session;
        this.ip = ip;
        this.port = port;
        return this;
    }
}
exports.GetRoomAddressRspProto = GetRoomAddressRspProto;
//# sourceMappingURL=GetRoomAddressRspProto.js.map