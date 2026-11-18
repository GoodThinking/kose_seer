"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemManager = void 0;
const BaseManager_1 = require("../Base/BaseManager");
const PacketMapHot_1 = require("../../Server/Packet/Send/System/PacketMapHot");
const OnlineTracker_1 = require("../Player/OnlineTracker");
const utils_1 = require("../../../shared/utils");
/**
 * 系统管理器
 * 处理系统相关的复杂业务逻辑
 */
class SystemManager extends BaseManager_1.BaseManager {
    // 官方地图列表
    static OFFICIAL_MAPS = [
        1, 4, 5, 325, 6, 7, 8, 328, 9, 10,
        333, 15, 17, 338, 19, 20, 25, 30,
        101, 102, 103, 40, 107, 47, 51, 54, 57, 314, 60
    ];
    /**
     * 处理获取地图热度
     * 复杂逻辑：需要查询所有地图的在线人数
     */
    async HandleMapHot() {
        // 获取所有地图的在线人数
        const mapCounts = OnlineTracker_1.OnlineTracker.Instance.GetAllMapCounts();
        const mapOnlineMap = new Map();
        for (const { mapId, count } of mapCounts) {
            mapOnlineMap.set(mapId, count);
        }
        // 构建官方地图列表
        const maps = [];
        for (const mapId of SystemManager.OFFICIAL_MAPS) {
            maps.push({
                mapId,
                onlineCount: mapOnlineMap.get(mapId) || 0
            });
        }
        await this.Player.SendPacket(new PacketMapHot_1.PacketMapHot(maps));
        const totalOnline = OnlineTracker_1.OnlineTracker.Instance.GetOnlineCount();
        utils_1.Logger.Info(`[SystemManager] 发送地图热度，共 ${maps.length} 个地图，总在线 ${totalOnline} 人`);
    }
}
exports.SystemManager = SystemManager;
//# sourceMappingURL=SystemManager.js.map