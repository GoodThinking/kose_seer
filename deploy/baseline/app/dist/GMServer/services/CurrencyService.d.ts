/**
 * 货币管理服务
 */
export declare class CurrencyService {
    /**
     * 修改金币（增加或减少）
     */
    modifyCoins(uid: number, amount: number): Promise<void>;
    /**
     * 设置金币（直接设置）
     */
    setCoins(uid: number, amount: number): Promise<void>;
    /**
     * 获取玩家货币信息
     */
    getCurrency(uid: number): Promise<any>;
}
//# sourceMappingURL=CurrencyService.d.ts.map