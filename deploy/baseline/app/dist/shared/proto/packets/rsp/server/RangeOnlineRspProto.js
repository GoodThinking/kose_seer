"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RangeOnlineRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
 * 响应: onlineCnt(4) + servers...
 */
class RangeOnlineRspProto extends BaseProto_1.BaseProto {
    onlineCnt = 0;
    servers = [];
    constructor() {
        super(CommandID_1.CommandID.RANGE_ONLINE);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(1000);
        // 服务器数量
        writer.WriteUInt32(this.onlineCnt);
        // 服务器列表（每个30字节）
        for (const server of this.servers) {
            writer.WriteUInt32(server.onlineID);
            writer.WriteUInt32(server.userCnt);
            // IP地址（16字节，补0）
            const ipBytes = Buffer.alloc(16);
            Buffer.from(server.ip, 'utf8').copy(ipBytes);
            writer.WriteBytes(ipBytes);
            // 端口（2字节）
            writer.WriteUInt16(server.port);
            // 好友数（4字节）
            writer.WriteUInt32(server.friends);
        }
        return writer.ToBuffer();
    }
}
exports.RangeOnlineRspProto = RangeOnlineRspProto;
//# sourceMappingURL=RangeOnlineRspProto.js.map