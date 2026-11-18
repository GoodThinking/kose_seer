"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerManager = void 0;
const proto_1 = require("../../../shared/proto");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const ClientConfig_1 = require("../../../shared/config/ClientConfig");
const utils_1 = require("../../../shared/utils");
/**
 * 服务器管理器
 * 负责管理服务器列表和在线状态
 */
class ServerManager {
    _packetBuilder;
    _onlineUsers = new Set(); // 在线用户集合
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 用户上线
     */
    UserOnline(userID) {
        this._onlineUsers.add(userID);
        utils_1.Logger.Debug(`[ServerManager] 用户上线: ${userID}, 当前在线: ${this._onlineUsers.size}`);
    }
    /**
     * 用户下线
     */
    UserOffline(userID) {
        this._onlineUsers.delete(userID);
        utils_1.Logger.Debug(`[ServerManager] 用户下线: ${userID}, 当前在线: ${this._onlineUsers.size}`);
    }
    /**
     * 获取在线人数
     */
    GetOnlineCount() {
        return this._onlineUsers.size;
    }
    /**
     * 获取用户的在线好友数
     */
    async GetOnlineFriendsCount(userID) {
        try {
            const friendData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_FriendData(userID);
            if (!friendData)
                return 0;
            // 统计在线好友数
            let count = 0;
            for (const friendID of friendData.FriendList) {
                if (this._onlineUsers.has(friendID)) {
                    count++;
                }
            }
            return count;
        }
        catch (err) {
            utils_1.Logger.Error(`[ServerManager] 获取在线好友数失败: uid=${userID}`, err);
            return 0;
        }
    }
    /**
     * 构建服务器列表（包含实时数据）
     */
    async buildServerList(userID) {
        const baseServers = ClientConfig_1.ClientConfig.Instance.Servers;
        const onlineCount = this.GetOnlineCount();
        const friendsCount = await this.GetOnlineFriendsCount(userID);
        return baseServers.map(base => ({
            onlineID: base.onlineID,
            userCnt: onlineCount, // 实时在线人数
            ip: base.ip,
            port: base.port,
            friends: friendsCount // 实时在线好友数
        }));
    }
    /**
     * 处理推荐服务器列表请求
     */
    async HandleCommendOnline(session, userID) {
        const servers = await this.buildServerList(userID);
        const proto = new proto_1.CommendOnlineRspProto();
        proto.maxOnlineID = servers.length > 0 ? Math.max(...servers.map(s => s.onlineID)) : 1;
        proto.isVIP = 0;
        proto.onlineCnt = servers.length;
        proto.servers = servers.map(s => ({
            onlineID: s.onlineID,
            userCnt: s.userCnt,
            ip: s.ip,
            port: s.port,
            friends: s.friends
        }));
        utils_1.Logger.Info(`[ServerManager] 构建服务器列表: count=${proto.onlineCnt}, online=${servers[0]?.userCnt || 0}, friends=${servers[0]?.friends || 0}`);
        // 加载好友列表和黑名单
        try {
            const friendData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_FriendData(userID);
            if (friendData) {
                // 构建好友信息（timePoke 暂时设为 0）
                proto.friends = friendData.FriendList.map(uid => ({
                    userID: uid,
                    timePoke: 0
                }));
                proto.blacklist = friendData.BlackList;
                utils_1.Logger.Info(`[ServerManager] 加载好友数据: friends=${proto.friends.length}, blacklist=${proto.blacklist.length}`);
            }
            else {
                proto.friends = [];
                proto.blacklist = [];
                utils_1.Logger.Info(`[ServerManager] 无好友数据，使用空列表`);
            }
        }
        catch (err) {
            utils_1.Logger.Error(`[ServerManager] 加载好友数据失败: uid=${userID}`, err);
            proto.friends = [];
            proto.blacklist = [];
        }
        const bodyData = proto.serialize();
        utils_1.Logger.Info(`[ServerManager] 响应体大小: ${bodyData.length} 字节`);
        // 使用 PacketBuilder 构建完整数据包
        const packet = this._packetBuilder.Build(proto.getCmdId(), userID, proto.getResult(), bodyData);
        session.Socket.write(packet);
    }
    /**
     * 处理范围服务器查询请求
     */
    async HandleRangeOnline(session, userID) {
        const servers = await this.buildServerList(userID);
        const proto = new proto_1.RangeOnlineRspProto();
        proto.onlineCnt = servers.length;
        proto.servers = servers.map(s => ({
            onlineID: s.onlineID,
            userCnt: s.userCnt,
            ip: s.ip,
            port: s.port,
            friends: s.friends
        }));
        // 使用 PacketBuilder 构建完整数据包
        const packet = this._packetBuilder.Build(proto.getCmdId(), userID, proto.getResult(), proto.serialize());
        session.Socket.write(packet);
    }
}
exports.ServerManager = ServerManager;
//# sourceMappingURL=ServerManager.js.map