import { IClientSession } from '../../Server/Packet/IHandler';
import { BaseProto } from '../../../shared/proto';
export declare class OnlineTracker {
    private static _instance;
    private _onlinePlayers;
    private _mapPlayerCount;
    private _mapUsers;
    private constructor();
    static get Instance(): OnlineTracker;
    /**
     * 记录玩家上线
     */
    PlayerLogin(userId: number, session: IClientSession): void;
    /**
     * 记录玩家下线
     */
    PlayerLogout(userId: number): void;
    /**
     * 将用户加入地图（权威成员表）
     */
    AddUserToMap(mapId: number, userId: number, session: IClientSession): void;
    /**
     * 将用户从地图移除（权威成员表）
     */
    RemoveUserFromMap(mapId: number, userId: number): void;
    /**
     * 返回指定地图上的所有 Session（快照）
     */
    GetClientsOnMap(mapId: number): IClientSession[];
    /**
     * 返回所有在线会话（快照）
     */
    GetAllClients(): IClientSession[];
    /**
     * 更新玩家所在地图
     */
    UpdatePlayerMap(userId: number, newMapId: number, mapType?: number, posX?: number, posY?: number): void;
    /**
     * 从地图移除玩家
     */
    private removeFromMap;
    /**
     * 添加玩家到地图
     */
    private addToMap;
    /**
     * 获取地图在线人数
     */
    GetMapPlayerCount(mapId: number): number;
    /**
     * 获取所有有人的地图及人数
     */
    GetAllMapCounts(): Array<{
        mapId: number;
        count: number;
    }>;
    /**
     * 获取在线玩家总数
     */
    GetOnlineCount(): number;
    /**
     * 获取玩家当前地图
     */
    GetPlayerMap(userId: number): number;
    /**
     * 获取玩家当前位置
     */
    GetPlayerPosition(userId: number): {
        x: number;
        y: number;
    } | null;
    /**
     * 获取指定地图的所有玩家ID
     */
    GetPlayersInMap(mapId: number): number[];
    /**
     * 广播消息给指定地图的所有玩家
     */
    BroadcastToMap(mapId: number, proto: BaseProto, excludeUserId?: number): Promise<number>;
    /**
     * 发送消息给指定玩家
     */
    SendToPlayer(userId: number, proto: BaseProto): Promise<boolean>;
    /**
     * 检查玩家是否在线
     */
    IsOnline(userId: number): boolean;
    /**
     * 更新玩家活跃时间
     */
    UpdateActivity(userId: number): void;
    /**
     * 清理超时玩家 (超过指定秒数无活动)
     */
    CleanupInactive(timeoutSeconds?: number): number;
    /**
     * 获取玩家Session
     */
    GetPlayerSession(userId: number): IClientSession | null;
}
//# sourceMappingURL=OnlineTracker.d.ts.map