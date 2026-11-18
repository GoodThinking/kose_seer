import { Request, Response } from 'express';
/**
 * 物品管理控制器
 */
export declare class ItemController {
    private itemService;
    constructor();
    /**
     * 发送物品
     */
    giveItem: (req: Request, res: Response) => Promise<void>;
    /**
     * 批量发送物品
     */
    giveItemBatch: (req: Request, res: Response) => Promise<void>;
    /**
     * 删除物品
     */
    removeItem: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取玩家物品列表
     */
    getPlayerItems: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=ItemController.d.ts.map