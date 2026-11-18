"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemListHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ItemListReqProto_1 = require("../../../../../shared/proto/packets/req/item/ItemListReqProto");
/**
 * 物品列表处理器
 * CMD 2605
 *
 * 重构说明：
 * - 不再需要依赖注入 ItemManager
 * - 直接使用 player.ItemManager
 */
let ItemListHandler = class ItemListHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new ItemListReqProto_1.ItemListReqProto();
        req.deserialize(body);
        // 直接调用 player.ItemManager
        await player.ItemManager.HandleItemList(req.itemType1, req.itemType2, req.itemType3);
    }
};
exports.ItemListHandler = ItemListHandler;
exports.ItemListHandler = ItemListHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.ITEM_LIST, decorators_1.InjectType.NONE)
], ItemListHandler);
//# sourceMappingURL=ItemListHandler.js.map