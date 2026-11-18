import { BaseProto } from '../../../shared/proto';
export type BroadcastScope = 'map' | 'world' | 'team' | 'player';
export interface IBroadcastTarget {
    scope: BroadcastScope;
    mapId?: number;
    teamId?: number;
    userId?: number;
    excludeUserId?: number;
}
/**
 * 通用广播服务
 * - map/world/team/player 统一入口
 * - 为聊天/动作/系统通知等广播场景提供统一能力
 */
export declare class BroadcastService {
    private static _instance;
    private _onlineTracker;
    private constructor();
    static get Instance(): BroadcastService;
    /**
     * 统一广播入口
     * 返回实际发送成功数量
     */
    Broadcast(proto: BaseProto, target: IBroadcastTarget): Promise<number>;
    SendToPlayer(userId: number, proto: BaseProto): Promise<boolean>;
    BroadcastToMap(mapId: number, proto: BaseProto, excludeUserId?: number): Promise<number>;
    BroadcastToWorld(proto: BaseProto, excludeUserId?: number): Promise<number>;
    BroadcastToTeam(teamId: number, proto: BaseProto, excludeUserId?: number): Promise<number>;
    /**
     * 系统消息广播（默认全服）
     */
    BroadcastSystemMessage(message: string, options?: {
        npcId?: number;
        type?: number;
        scope?: BroadcastScope;
        mapId?: number;
        teamId?: number;
        userId?: number;
        excludeUserId?: number;
    }): Promise<number>;
}
//# sourceMappingURL=BroadcastService.d.ts.map