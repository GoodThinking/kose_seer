"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.currencyRouter = void 0;
const express_1 = require("express");
const CurrencyController_1 = require("../controllers/CurrencyController");
exports.currencyRouter = (0, express_1.Router)();
const currencyController = new CurrencyController_1.CurrencyController();
// 获取玩家货币信息
exports.currencyRouter.get('/:uid', currencyController.getCurrency);
// 修改金币（增加或减少）
exports.currencyRouter.patch('/:uid/coins', currencyController.modifyCoins);
// 设置金币（直接设置）
exports.currencyRouter.put('/:uid/coins', currencyController.setCoins);
//# sourceMappingURL=currency.js.map