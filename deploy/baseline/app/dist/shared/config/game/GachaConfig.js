"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GachaConfig = void 0;
const ConfigRegistry_1 = require("../ConfigRegistry");
const ConfigDefinitions_1 = require("../ConfigDefinitions");
const utils_1 = require("../../utils");
/**
 * 扭蛋机配置
 * 加载并管理扭蛋奖励配置
 */
class GachaConfig {
    static _instance = null;
    _rewards = [];
    _totalWeight = 0;
    constructor() {
        this.loadConfig();
    }
    static get Instance() {
        if (!GachaConfig._instance) {
            GachaConfig._instance = new GachaConfig();
        }
        return GachaConfig._instance;
    }
    loadConfig() {
        this.loadDefaultRewards();
        const config = ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.GACHA_REWARDS);
        if (config && config.rewards && config.rewards.length > 0) {
            this._rewards = config.rewards;
            this.recalcTotalWeight();
            utils_1.Logger.Info(`[GachaConfig] 已加载 ${this._rewards.length} 项扭蛋奖励`);
        }
        else {
            utils_1.Logger.Info(`[GachaConfig] 配置为空，使用默认奖励`);
        }
    }
    loadDefaultRewards() {
        const rareItems = [
            { itemID: 490001, weight: 1, name: '上古炎兽精元', isGold: false },
            { itemID: 490002, weight: 1, name: '始祖灵兽精元', isGold: false },
            { itemID: 490003, weight: 1, name: '宝贝鲤精元', isGold: false },
        ];
        const commonItems = [
            { itemID: 300001, weight: 5, name: '普通精灵胶囊', isGold: false },
            { itemID: 300002, weight: 5, name: '中级精灵胶囊', isGold: false },
            { itemID: 300003, weight: 5, name: '高级精灵胶囊', isGold: false },
            { itemID: 300004, weight: 5, name: '超级精灵胶囊', isGold: false },
            { itemID: 300011, weight: 5, name: '初级体力药剂', isGold: false },
            { itemID: 300012, weight: 5, name: '中级体力药剂', isGold: false },
            { itemID: 300013, weight: 5, name: '高级体力药剂', isGold: false },
            { itemID: 300014, weight: 5, name: '超级体力药剂', isGold: false },
            { itemID: 300015, weight: 5, name: '特级体力药剂', isGold: false },
            { itemID: 300016, weight: 5, name: '初级活力药剂', isGold: false },
            { itemID: 300017, weight: 5, name: '中级活力药剂', isGold: false },
            { itemID: 300018, weight: 5, name: '高级活力药剂', isGold: false },
            { itemID: 300019, weight: 5, name: '超级活力药剂', isGold: false },
            { itemID: 300152, weight: 5, name: '形态固定胶囊', isGold: false },
            { itemID: 300153, weight: 5, name: '形态还原胶囊', isGold: false },
            { itemID: 300651, weight: 5, name: '全能学习力注入剂', isGold: false },
        ];
        this._rewards = [...rareItems, ...commonItems];
        this.recalcTotalWeight();
    }
    recalcTotalWeight() {
        this._totalWeight = 0;
        for (const r of this._rewards) {
            if (r.weight > 0) {
                this._totalWeight += r.weight;
            }
        }
    }
    get Rewards() {
        return this._rewards;
    }
    get TotalWeight() {
        return this._totalWeight;
    }
    RollGacha() {
        if (this._totalWeight <= 0 || this._rewards.length === 0) {
            return { itemID: 0, count: 0 };
        }
        const rnd = Math.floor(Math.random() * this._totalWeight);
        let current = 0;
        for (const r of this._rewards) {
            if (r.weight <= 0)
                continue;
            if (rnd < current + r.weight) {
                return { itemID: r.itemID, count: 1 };
            }
            current += r.weight;
        }
        return { itemID: this._rewards[0].itemID, count: 1 };
    }
}
exports.GachaConfig = GachaConfig;
//# sourceMappingURL=GachaConfig.js.map