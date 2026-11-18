"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemRouter = void 0;
const express_1 = require("express");
const ItemController_1 = require("../controllers/ItemController");
exports.itemRouter = (0, express_1.Router)();
const itemController = new ItemController_1.ItemController();
// 获取玩家物品列表
exports.itemRouter.get('/:uid', itemController.getPlayerItems);
// 发送物品
exports.itemRouter.post('/:uid', itemController.giveItem);
// 批量发送物品
exports.itemRouter.post('/:uid/batch', itemController.giveItemBatch);
// 删除物品
exports.itemRouter.delete('/:uid', itemController.removeItem);
//# sourceMappingURL=item.js.map