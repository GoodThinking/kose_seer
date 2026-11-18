"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommendOnlineRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
 * 响应: maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers... + friendData
 */
class CommendOnlineRspProto extends BaseProto_1.BaseProto {
    maxOnlineID = 0;
    isVIP = 0;
    onlineCnt = 0;
    servers = [];
    friends = [];
    blacklist = [];
    constructor() {
        super(CommandID_1.CommandID.COMMEND_ONLINE);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(2000);
        // 基础信息
        writer.WriteUInt32(this.maxOnlineID);
        writer.WriteUInt32(this.isVIP);
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
        // 好友数据
        writer.WriteUInt32(this.friends.length);
        for (const friend of this.friends) {
            writer.WriteUInt32(friend.userID);
            writer.WriteUInt32(friend.timePoke);
        }
        // 黑名单数据
        writer.WriteUInt32(this.blacklist.length);
        for (const userId of this.blacklist) {
            writer.WriteUInt32(userId);
        }
        return writer.ToBuffer();
    }
}
exports.CommendOnlineRspProto = CommendOnlineRspProto;
//# sourceMappingURL=CommendOnlineRspProto.js.map