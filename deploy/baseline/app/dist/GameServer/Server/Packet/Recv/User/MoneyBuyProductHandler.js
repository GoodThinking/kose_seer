"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MoneyBuyProductHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const CoinProductPurchase_1 = require("../../../../Game/Item/CoinProductPurchase");
const PacketMoneyBuyProduct_1 = require("../../Send/User/PacketMoneyBuyProduct");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const utils_1 = require("../../../../../shared/utils");
let MoneyBuyProductHandler = class MoneyBuyProductHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 6) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.MONEY_BUY_PRODUCT).setResult(5001));
            return;
        }
        let committed = false;
        try {
            const receipt = await (0, CoinProductPurchase_1.BuyCoinProduct)(player, body.readUInt32BE(0), body.readUInt16BE(4));
            committed = true;
            await player.SendPacket(new PacketMoneyBuyProduct_1.PacketMoneyBuyProduct(receipt.spentCoins, receipt.coins));
        }
        catch (error) {
            utils_1.Logger.Error(committed ? '[CoinProduct] Purchase committed; notification failed' : '[CoinProduct] Purchase failed', error instanceof Error ? error : new Error(String(error)));
            if (!committed)
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.MONEY_BUY_PRODUCT).setResult(error instanceof CoinProductPurchase_1.CoinProductError ? error.code : 5000));
        }
    }
};
exports.MoneyBuyProductHandler = MoneyBuyProductHandler;
exports.MoneyBuyProductHandler = MoneyBuyProductHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.MONEY_BUY_PRODUCT, decorators_1.InjectType.NONE)
], MoneyBuyProductHandler);
//# sourceMappingURL=MoneyBuyProductHandler.js.map