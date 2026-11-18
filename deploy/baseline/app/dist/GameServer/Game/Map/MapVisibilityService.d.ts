import { BaseProto } from '../../../shared/proto';
import { OnlineTracker } from '../Player/OnlineTracker';
interface IMapBroadcastOptions {
    excludeUserId?: number;
}
/**
 * 地图可见性广播服务
 * - 统一同图广播入口
 * - 统一同图玩家列表刷新入口
 */
export declare class MapVisibilityService {
    private _onlineTracker;
    private _broadcastService;
    constructor(onlineTracker: OnlineTracker);
    /**
     * 向同图玩家广播协议包
     */
    BroadcastToMap(mapId: number, proto: BaseProto, options?: IMapBroadcastOptions): Promise<number>;
    /**
     * 刷新同图玩家列表（LIST_MAP_PLAYER）
     * 返回成功刷新的玩家数量
     */
    RefreshMapPlayerLists(mapId: number, options?: IMapBroadcastOptions): Promise<number>;
}
export {};
//# sourceMappingURL=MapVisibilityService.d.ts.map