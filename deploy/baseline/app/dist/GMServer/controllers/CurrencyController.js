"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyController = void 0;
const CurrencyService_1 = require("../services/CurrencyService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 货币管理控制器
 */
class CurrencyController {
    currencyService;
    constructor() {
        this.currencyService = new CurrencyService_1.CurrencyService();
    }
    /**
     * 修改金币
     */
    modifyCoins = async (req, res) => {
        try {
            const { uid } = req.params;
            const { amount } = req.body;
            await this.currencyService.modifyCoins(Number(uid), amount);
            res.json({ success: true, message: '金币修改成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[CurrencyController] 修改金币失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 设置金币
     */
    setCoins = async (req, res) => {
        try {
            const { uid } = req.params;
            const { amount } = req.body;
            await this.currencyService.setCoins(Number(uid), amount);
            res.json({ success: true, message: '金币设置成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[CurrencyController] 设置金币失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 获取玩家货币信息
     */
    getCurrency = async (req, res) => {
        try {
            const { uid } = req.params;
            const currency = await this.currencyService.getCurrency(Number(uid));
            res.json({ success: true, data: currency });
        }
        catch (error) {
            Logger_1.Logger.Error(`[CurrencyController] 获取货币信息失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.CurrencyController = CurrencyController;
//# sourceMappingURL=CurrencyController.js.map