"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const DatabaseHelper_1 = require("../../DataBase/DatabaseHelper");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 货币管理服务
 */
class CurrencyService {
    /**
     * 修改金币（增加或减少）
     */
    async modifyCoins(uid, amount) {
        const playerData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_PlayerData(uid);
        if (!playerData) {
            throw new Error('玩家不存在');
        }
        playerData.coins += amount;
        Logger_1.Logger.Info(`[CurrencyService] 修改金币: uid=${uid}, amount=${amount}, newCoins=${playerData.coins}`);
    }
    /**
     * 设置金币（直接设置）
     */
    async setCoins(uid, amount) {
        const playerData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_PlayerData(uid);
        if (!playerData) {
            throw new Error('玩家不存在');
        }
        playerData.coins = amount;
        Logger_1.Logger.Info(`[CurrencyService] 设置金币: uid=${uid}, coins=${amount}`);
    }
    /**
     * 获取玩家货币信息
     */
    async getCurrency(uid) {
        const playerData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_PlayerData(uid);
        if (!playerData) {
            throw new Error('玩家不存在');
        }
        return {
            coins: playerData.coins,
            // 可以添加其他货币类型
        };
    }
}
exports.CurrencyService = CurrencyService;
//# sourceMappingURL=CurrencyService.js.map