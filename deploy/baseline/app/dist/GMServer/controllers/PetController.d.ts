import { Request, Response } from 'express';
/**
 * 精灵管理控制器
 */
export declare class PetController {
    private petService;
    constructor();
    /**
     * 发送精灵
     */
    givePet: (req: Request, res: Response) => Promise<Response | void>;
    /**
     * 删除精灵
     */
    removePet: (req: Request, res: Response) => Promise<Response | void>;
    /**
     * 修改精灵属性（批量更新）
     */
    updatePet: (req: Request, res: Response) => Promise<Response | void>;
    /**
     * 获取玩家精灵列表
     */
    getPlayerPets: (req: Request, res: Response) => Promise<void>;
    /**
     * 治疗精灵
     */
    curePet: (req: Request, res: Response) => Promise<Response | void>;
    /**
     * 治疗所有精灵
     */
    cureAllPets: (req: Request, res: Response) => Promise<void>;
    /**
     * 设置精灵等级
     */
    setPetLevel: (req: Request, res: Response) => Promise<Response | void>;
}
//# sourceMappingURL=PetController.d.ts.map