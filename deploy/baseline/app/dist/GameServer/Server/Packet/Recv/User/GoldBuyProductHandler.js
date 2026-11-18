"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoldBuyProductHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GoldBuyProductReqProto_1 = require("../../../../../shared/proto/packets/req/user/GoldBuyProductReqProto");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 1104 GOLD_BUY_PRODUCT] 使用金豆购买商品
 */
let GoldBuyProductHandler = class GoldBuyProductHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new GoldBuyProductReqProto_1.GoldBuyProductReqProto();
        req.deserialize(body);
        utils_1.Logger.Info(`[GoldBuyProductHandler] UserID=${player.Data.userID}, ProductId=${req.productId}, Count=${req.count}`);
        await player.ItemManager.HandleGoldBuyProduct(req.productId, req.count);
    }
};
exports.GoldBuyProductHandler = GoldBuyProductHandler;
exports.GoldBuyProductHandler = GoldBuyProductHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GOLD_BUY_PRODUCT, decorators_1.InjectType.NONE)
], GoldBuyProductHandler);
//# sourceMappingURL=GoldBuyProductHandler.js.map