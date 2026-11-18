import { Request, Response } from 'express';
/**
 * 货币管理控制器
 */
export declare class CurrencyController {
    private currencyService;
    constructor();
    /**
     * 修改金币
     */
    modifyCoins: (req: Request, res: Response) => Promise<void>;
    /**
     * 设置金币
     */
    setCoins: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取玩家货币信息
     */
    getCurrency: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=CurrencyController.d.ts.map