"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMService = void 0;
const DatabaseHelper_1 = require("../../DataBase/DatabaseHelper");
const Logger_1 = require("../../shared/utils/Logger");
const PlayerService_1 = require("./PlayerService");
const ServerService_1 = require("./ServerService");
const OnlineTracker_1 = require("../../GameServer/Game/Player/OnlineTracker");
const PlayerManager_1 = require("../../GameServer/Game/Player/PlayerManager");
const PacketItemBuy_1 = require("../../GameServer/Server/Packet/Send/Item/PacketItemBuy");
class GMService {
    playerService;
    serverService;
    constructor() {
        this.playerService = new PlayerService_1.PlayerService();
        this.serverService = new ServerService_1.ServerService();
    }
    // ==================== 玩家管理 ====================
    async getPlayers(page, limit, search, onlineOnly) {
        return this.playerService.getPlayers(page, limit, search, onlineOnly);
    }
    async getPlayerDetail(uid) {
        return this.playerService.getPlayerDetail(uid);
    }
    async updatePlayer(uid, field, value) {
        return this.playerService.updatePlayer(uid, field, value);
    }
    async banPlayer(uid, banType, reason) {
        return this.playerService.banPlayer(uid, banType, reason);
    }
    async kickPlayer(uid, reason) {
        return this.playerService.kickPlayer(uid, reason);
    }
    // ==================== 物品管理 ====================
    async giveItem(uid, itemId, count, expireTime = 0) {
        const itemData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
        itemData.AddItem(itemId, count, expireTime);
        Logger_1.Logger.Info(`[GMService] 发送物品: uid=${uid}, itemId=${itemId}, count=${count}, expireTime=${expireTime}`);
        // 如果玩家在线，发送通知
        try {
            if (OnlineTracker_1.OnlineTracker.Instance.IsOnline(uid)) {
                const player = PlayerManager_1.PlayerManager.GetInstance().GetPlayer(uid);
                if (player) {
                    // 发送物品购买通知 (ITEM_BUY - CMD 2601)
                    await player.SendPacket(new PacketItemBuy_1.PacketItemBuy(player.Data.coins, // 当前金币（不变）
                    itemId, count, expireTime));
                    Logger_1.Logger.Info(`[GMService] 已发送物品通知给在线玩家: uid=${uid}, itemId=${itemId}, count=${count}`);
                }
            }
        }
        catch (error) {
            Logger_1.Logger.Warn(`[GMService] 发送物品通知失败: uid=${uid}, error=${error}`);
            // 不影响主流程，继续执行
        }
    }
    async givePet(uid, petId, level, shiny) {
        const petData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
        // TODO: 实现发送精灵逻辑
        Logger_1.Logger.Info(`[GMService] 发送精灵: uid=${uid}, petId=${petId}, level=${level}, shiny=${shiny}`);
    }
    async modifyCoins(uid, amount) {
        const playerData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_PlayerData(uid);
        if (!playerData) {
            throw new Error('玩家不存在');
        }
        playerData.coins += amount;
        Logger_1.Logger.Info(`[GMService] 修改金币: uid=${uid}, amount=${amount}, newCoins=${playerData.coins}`);
    }
    // ==================== 服务器管理 ====================
    async getServerStatus() {
        return this.serverService.getServerStatus();
    }
    async sendAnnouncement(message, type) {
        return this.serverService.sendAnnouncement(message, type);
    }
    // ==================== 日志查询 ====================
    async getLogs(page, limit, type, uid) {
        // TODO: 实现日志查询
        // 从数据库查询操作日志
        return {
            total: 0,
            page,
            limit,
            logs: []
        };
    }
}
exports.GMService = GMService;
//# sourceMappingURL=GMService.js.map