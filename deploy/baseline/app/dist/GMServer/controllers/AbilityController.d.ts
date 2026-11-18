import { Request, Response } from 'express';
/**
 * 精灵特性管理控制器
 */
export declare class AbilityController {
    private abilityService;
    constructor();
    /**
     * 获取所有可用特性列表
     * GET /api/abilities
     */
    getAllAbilities: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取指定精灵的特性
     * GET /api/abilities/:uid/:catchTime
     */
    getPetAbility: (req: Request, res: Response) => Promise<Response | void>;
    /**
     * 设置精灵特性（替换现有）
     * POST /api/abilities/:uid
     */
    setAbility: (req: Request, res: Response) => Promise<Response | void>;
    /**
     * 清除精灵特性
     * DELETE /api/abilities/:uid
     */
    clearAbility: (req: Request, res: Response) => Promise<Response | void>;
}
//# sourceMappingURL=AbilityController.d.ts.map