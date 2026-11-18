export interface IGachaReward {
    itemID: number;
    weight: number;
    name?: string;
    isGold?: boolean;
}
export interface IGachaConfig {
    rewards: IGachaReward[];
}
/**
 * 扭蛋机配置
 * 加载并管理扭蛋奖励配置
 */
export declare class GachaConfig {
    private static _instance;
    private _rewards;
    private _totalWeight;
    private constructor();
    static get Instance(): GachaConfig;
    private loadConfig;
    private loadDefaultRewards;
    private recalcTotalWeight;
    get Rewards(): IGachaReward[];
    get TotalWeight(): number;
    RollGacha(): {
        itemID: number;
        count: number;
    };
}
//# sourceMappingURL=GachaConfig.d.ts.map