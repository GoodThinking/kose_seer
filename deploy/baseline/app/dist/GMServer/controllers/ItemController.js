"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemController = void 0;
const ItemService_1 = require("../services/ItemService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 物品管理控制器
 */
class ItemController {
    itemService;
    constructor() {
        this.itemService = new ItemService_1.ItemService();
    }
    /**
     * 发送物品
     */
    giveItem = async (req, res) => {
        try {
            const { uid } = req.params;
            const { itemId, count } = req.body;
            await this.itemService.giveItem(Number(uid), itemId, count);
            res.json({ success: true, message: '物品发送成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ItemController] 发送物品失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 批量发送物品
     */
    giveItemBatch = async (req, res) => {
        try {
            const { uid } = req.params;
            const { items } = req.body; // [{ itemId, count }]
            await this.itemService.giveItemBatch(Number(uid), items);
            res.json({ success: true, message: '批量发送物品成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ItemController] 批量发送物品失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 删除物品
     */
    removeItem = async (req, res) => {
        try {
            const { uid } = req.params;
            const { itemId, count } = req.body;
            await this.itemService.removeItem(Number(uid), itemId, count);
            res.json({ success: true, message: '物品删除成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ItemController] 删除物品失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 获取玩家物品列表
     */
    getPlayerItems = async (req, res) => {
        try {
            const { uid } = req.params;
            const items = await this.itemService.getPlayerItems(Number(uid));
            res.json({ success: true, data: items });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ItemController] 获取玩家物品失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.ItemController = ItemController;
//# sourceMappingURL=ItemController.js.map