import { PacketBuilder } from '../../../shared/protocol/PacketBuilder';
import { IClientSession } from '../../Server/Packet/IHandler';
/**
 * 服务器管理器
 * 负责管理服务器列表和在线状态
 */
export declare class ServerManager {
    private _packetBuilder;
    private _onlineUsers;
    constructor(packetBuilder: PacketBuilder);
    /**
     * 用户上线
     */
    UserOnline(userID: number): void;
    /**
     * 用户下线
     */
    UserOffline(userID: number): void;
    /**
     * 获取在线人数
     */
    GetOnlineCount(): number;
    /**
     * 获取用户的在线好友数
     */
    private GetOnlineFriendsCount;
    /**
     * 构建服务器列表（包含实时数据）
     */
    private buildServerList;
    /**
     * 处理推荐服务器列表请求
     */
    HandleCommendOnline(session: IClientSession, userID: number): Promise<void>;
    /**
     * 处理范围服务器查询请求
     */
    HandleRangeOnline(session: IClientSession, userID: number): Promise<void>;
}
export { IServerInfo } from '../../Server/Packet/Send/ServerPacket';
//# sourceMappingURL=ServerManager.d.ts.map