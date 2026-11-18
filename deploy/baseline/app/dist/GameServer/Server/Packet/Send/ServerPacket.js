"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerPacket = void 0;
const CommandID_1 = require("../../../../shared/protocol/CommandID");
const proto_1 = require("../../../../shared/proto");
const ClientConfig_1 = require("../../../../shared/config/ClientConfig");
/**
 * 服务器响应数据包
 * 包含命令:
 * - [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
 * - [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
 */
class ServerPacket {
    _packetBuilder;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
     * @param userID 用户ID
     * @param onlineCount 当前在线人数（实时）
     * @param friendsCount 好友在线数（实时）
     */
    CommendOnline(userID, onlineCount = 0, friendsCount = 0) {
        // 从配置获取服务器基础信息
        const baseServers = ClientConfig_1.ClientConfig.Instance.Servers;
        // 构建完整服务器信息（添加动态数据）
        const servers = baseServers.map(base => ({
            onlineID: base.onlineID,
            userCnt: onlineCount, // 实时在线人数
            ip: base.ip,
            port: base.port,
            friends: friendsCount // 实时好友数
        }));
        // 使用Proto构建响应
        const proto = new proto_1.CommendOnlineRspProto();
        proto.maxOnlineID = servers.length;
        proto.isVIP = 0;
        proto.onlineCnt = servers.length;
        proto.servers = servers.map(s => ({
            onlineID: s.onlineID,
            userCnt: s.userCnt,
            ip: s.ip,
            port: s.port,
            friends: s.friends
        }));
        return this._packetBuilder.Build(CommandID_1.CommandID.COMMEND_ONLINE, userID, 0, proto.serialize());
    }
    /**
     * [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
     * @param userID 用户ID
     * @param onlineCount 当前在线人数（实时）
     * @param friendsCount 好友在线数（实时）
     */
    RangeOnline(userID, onlineCount = 0, friendsCount = 0) {
        // 从配置获取服务器基础信息
        const baseServers = ClientConfig_1.ClientConfig.Instance.Servers;
        // 构建完整服务器信息（添加动态数据）
        const servers = baseServers.map(base => ({
            onlineID: base.onlineID,
            userCnt: onlineCount, // 实时在线人数
            ip: base.ip,
            port: base.port,
            friends: friendsCount // 实时好友数
        }));
        // 使用Proto构建响应
        const proto = new proto_1.RangeOnlineRspProto();
        proto.onlineCnt = servers.length;
        proto.servers = servers.map(s => ({
            onlineID: s.onlineID,
            userCnt: s.userCnt,
            ip: s.ip,
            port: s.port,
            friends: s.friends
        }));
        return this._packetBuilder.Build(CommandID_1.CommandID.RANGE_ONLINE, userID, 0, proto.serialize());
    }
}
exports.ServerPacket = ServerPacket;
//# sourceMappingURL=ServerPacket.js.map