"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GachaManager = void 0;
const BaseManager_1 = require("../Base/BaseManager");
const utils_1 = require("../../../shared/utils");
const GachaConfig_1 = require("../../../shared/config/game/GachaConfig");
const GachaRspProto_1 = require("../../../shared/proto/packets/rsp/gacha/GachaRspProto");
const EventTypes_1 = require("../Event/EventTypes");
const GACHA_TICKET_ID = 400501;
class GachaManager extends BaseManager_1.BaseManager {
    constructor(player) {
        super(player);
    }
    async HandleGacha(times) {
        const release = this.Player.ItemManager.ItemData.BeginMutation();
        if (!release) {
            const response = new GachaRspProto_1.GachaRspProto();
            response.setResult(5000);
            await this.Player.SendPacket(response);
            return;
        }
        try {
            await this.RollGacha(times);
        }
        finally {
            release();
        }
    }
    async RollGacha(times) {
        const playerData = this.Player.Data;
        const itemManager = this.Player.ItemManager;
        // 检查扭蛋牌数量
        const ticketCount = itemManager.GetItemCount(GACHA_TICKET_ID);
        if (ticketCount < times) {
            utils_1.Logger.Info(`[GachaManager] 扭蛋牌不足: 需要=${times}, 已有=${ticketCount}`);
            await this.Player.SendPacket(new GachaRspProto_1.GachaRspProto());
            return;
        }
        // 消耗扭蛋牌
        itemManager.ConsumeItem(GACHA_TICKET_ID, times);
        const rewards = new Map();
        let lastItemId = 0;
        let lastCount = 0;
        for (let i = 0; i < times; i++) {
            const result = GachaConfig_1.GachaConfig.Instance.RollGacha();
            if (result.itemID === 0) {
                utils_1.Logger.Warn('[GachaManager] 奖池为空');
                continue;
            }
            // 通过 ItemManager 公开 API 添加物品
            await itemManager.GiveItem(result.itemID, result.count, EventTypes_1.ItemGainSource.GACHA);
            rewards.set(result.itemID, (rewards.get(result.itemID) || 0) + result.count);
            lastItemId = result.itemID;
            lastCount = result.count;
        }
        const rsp = new GachaRspProto_1.GachaRspProto();
        rsp.coins = playerData.coins || 0;
        rsp.petId = 0;
        rsp.catchTime = 0;
        rsp.itemCount = rewards.size;
        rsp.items = Array.from(rewards.entries()).map(([itemId, count]) => ({ itemId, count }));
        await this.Player.SendPacket(rsp);
        utils_1.Logger.Info(`[GachaManager] 玩家 ${this.UserID} 抽${times}次, 获得${rewards.size}种物品, 最后获得: itemID=${lastItemId} count=${lastCount}`);
    }
}
exports.GachaManager = GachaManager;
//# sourceMappingURL=GachaManager.js.map