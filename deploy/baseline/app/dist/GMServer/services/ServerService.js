"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerService = void 0;
const Logger_1 = require("../../shared/utils/Logger");
const DatabaseManager_1 = require("../../DataBase/DatabaseManager");
/**
 * 服务器管理服务
 */
class ServerService {
    /**
     * 获取服务器状态
     */
    async getServerStatus() {
        try {
            // 获取在线玩家数
            const { OnlineTracker } = await Promise.resolve().then(() => __importStar(require('../../GameServer/Game/Player/OnlineTracker')));
            const onlinePlayers = OnlineTracker.Instance.GetOnlineCount();
            // 获取总玩家数
            const totalPlayersResult = await DatabaseManager_1.DatabaseManager.Instance.Query('SELECT COUNT(*) as total FROM players');
            const totalPlayers = totalPlayersResult[0]?.total || 0;
            // 获取地图人数分布
            const mapCounts = OnlineTracker.Instance.GetAllMapCounts();
            return {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                onlinePlayers,
                totalPlayers,
                mapCounts,
                timestamp: Date.now()
            };
        }
        catch (error) {
            Logger_1.Logger.Error('[ServerService] 获取服务器状态失败', error);
            // 返回基础信息
            return {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                onlinePlayers: 0,
                totalPlayers: 0,
                mapCounts: [],
                timestamp: Date.now()
            };
        }
    }
    /**
     * 全服公告
     */
    async sendAnnouncement(message, type) {
        // TODO: 实现全服公告
        // 1. 遍历所有在线玩家
        // 2. 发送公告消息
        Logger_1.Logger.Info(`[ServerService] 发送公告: type=${type}, message=${message}`);
    }
    /**
     * 设置维护模式
     */
    async setMaintenance(enabled, message) {
        // TODO: 实现维护模式
        // 1. 设置维护标志
        // 2. 如果开启维护，踢出所有玩家
        // 3. 阻止新玩家登录
        Logger_1.Logger.Info(`[ServerService] 维护模式: enabled=${enabled}, message=${message}`);
    }
}
exports.ServerService = ServerService;
//# sourceMappingURL=ServerService.js.map