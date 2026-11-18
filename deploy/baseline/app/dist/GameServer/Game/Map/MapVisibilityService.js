"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapVisibilityService = void 0;
const utils_1 = require("../../../shared/utils");
const BroadcastService_1 = require("../Broadcast/BroadcastService");
/**
 * 地图可见性广播服务
 * - 统一同图广播入口
 * - 统一同图玩家列表刷新入口
 */
class MapVisibilityService {
    _onlineTracker;
    _broadcastService;
    constructor(onlineTracker) {
        this._onlineTracker = onlineTracker;
        this._broadcastService = BroadcastService_1.BroadcastService.Instance;
    }
    /**
     * 向同图玩家广播协议包
     */
    async BroadcastToMap(mapId, proto, options) {
        if (mapId <= 0) {
            return 0;
        }
        return this._broadcastService.BroadcastToMap(mapId, proto, options?.excludeUserId);
    }
    /**
     * 刷新同图玩家列表（LIST_MAP_PLAYER）
     * 返回成功刷新的玩家数量
     */
    async RefreshMapPlayerLists(mapId, options) {
        if (mapId <= 0) {
            return 0;
        }
        let refreshed = 0;
        const sessions = this._onlineTracker.GetClientsOnMap(mapId);
        for (const session of sessions) {
            if (options?.excludeUserId !== undefined && session.UserID === options.excludeUserId) {
                continue;
            }
            if (!session.Player) {
                utils_1.Logger.Debug(`[MapVisibilityService] Skip refresh map=${mapId}, user=${session.UserID}, Player not ready`);
                continue;
            }
            await session.Player.MapManager.sendMapPlayerList(mapId);
            refreshed++;
        }
        return refreshed;
    }
}
exports.MapVisibilityService = MapVisibilityService;
//# sourceMappingURL=MapVisibilityService.js.map