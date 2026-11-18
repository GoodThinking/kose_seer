import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
/**
 * 完整服务器信息接口（包含动态数据）
 */
export interface IServerInfo {
    onlineID: number;
    userCnt: number;
    ip: string;
    port: number;
    friends: number;
}
/**
 * 服务器响应数据包
 * 包含命令:
 * - [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
 * - [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
 */
export declare class ServerPacket {
    private _packetBuilder;
    constructor(packetBuilder: PacketBuilder);
    /**
     * [CMD: COMMEND_ONLINE (105)] 推荐服务器列表响应
     * @param userID 用户ID
     * @param onlineCount 当前在线人数（实时）
     * @param friendsCount 好友在线数（实时）
     */
    CommendOnline(userID: number, onlineCount?: number, friendsCount?: number): Buffer;
    /**
     * [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
     * @param userID 用户ID
     * @param onlineCount 当前在线人数（实时）
     * @param friendsCount 好友在线数（实时）
     */
    RangeOnline(userID: number, onlineCount?: number, friendsCount?: number): Buffer;
}
//# sourceMappingURL=ServerPacket.d.ts.map