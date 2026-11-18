import { BaseProto } from '../../../base/BaseProto';
/**
 * 在线用户信息
 */
export interface IOnlineInfo {
    userId: number;
    serverId: number;
    mapType: number;
    mapId: number;
}
/**
 * [CMD: 2157 SEE_ONLINE] 查看在线状态响应
 *
 * 响应格式:
 * - onlineCount (uint32) - 在线用户数量
 * - 对于每个在线用户：
 *   - userId (uint32) - 用户ID
 *   - serverId (uint32) - 服务器ID
 *   - mapType (uint32) - 地图类型
 *   - mapId (uint32) - 地图ID
 */
export declare class SeeOnlineRspProto extends BaseProto {
    onlineList: IOnlineInfo[];
    constructor();
    setOnlineUsers(users: IOnlineInfo[]): void;
    serialize(): Buffer;
}
//# sourceMappingURL=SeeOnlineRspProto.d.ts.map