"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemService = void 0;
const DatabaseHelper_1 = require("../../DataBase/DatabaseHelper");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 物品管理服务
 */
class ItemService {
    /**
     * 发送物品
     */
    async giveItem(uid, itemId, count) {
        const itemData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
        itemData.AddItem(itemId, count, 0);
        Logger_1.Logger.Info(`[ItemService] 发送物品: uid=${uid}, itemId=${itemId}, count=${count}`);
    }
    /**
     * 批量发送物品
     */
    async giveItemBatch(uid, items) {
        const itemData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_ItemData(uid);
        for (const item of items) {
            itemData.AddItem(item.itemId, item.count, 0);
        }
        Logger_1.Logger.Info(`[ItemService] 批量发送物品: uid=${uid}, count=${items.length}`);
    }
    /**
     * 删除物品
     */
    async removeItem(uid, itemId, count) {
        const itemData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_ItemData(uid);
        if (!itemData) {
            throw new Error('玩家物品数据不存在');
        }
        if (itemData.HasPendingReward())
            throw new Error('Inventory reward pending');
        const item = itemData.ItemList.find(i => i.itemId === itemId);
        if (!item) {
            throw new Error('物品不存在');
        }
        if (item.count < count) {
            throw new Error('物品数量不足');
        }
        item.count -= count;
        if (item.count <= 0) {
            const index = itemData.ItemList.indexOf(item);
            itemData.ItemList.splice(index, 1);
        }
        Logger_1.Logger.Info(`[ItemService] 删除物品: uid=${uid}, itemId=${itemId}, count=${count}`);
    }
    /**
     * 获取玩家物品列表
     */
    async getPlayerItems(uid) {
        const itemData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_ItemData(uid);
        if (!itemData) {
            return [];
        }
        return itemData.ItemList;
    }
}
exports.ItemService = ItemService;
//# sourceMappingURL=ItemService.js.map