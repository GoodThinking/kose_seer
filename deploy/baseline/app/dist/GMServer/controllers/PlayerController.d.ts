import { Request, Response } from 'express';
/**
 * 玩家管理控制器
 */
export declare class PlayerController {
    private playerService;
    constructor();
    /**
     * 获取玩家列表
     */
    getPlayers: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取玩家详情
     */
    getPlayerDetail: (req: Request, res: Response) => Promise<void>;
    /**
     * 修改玩家数据
     */
    updatePlayer: (req: Request, res: Response) => Promise<void>;
    /**
     * 修改账号信息（邮箱、密码）
     */
    updateAccount: (req: Request, res: Response) => Promise<void>;
    /**
     * 封禁/解封玩家
     */
    banPlayer: (req: Request, res: Response) => Promise<void>;
    /**
     * 踢出玩家
     */
    kickPlayer: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=PlayerController.d.ts.map