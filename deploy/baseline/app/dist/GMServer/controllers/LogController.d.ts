import { Request, Response } from 'express';
/**
 * 日志管理控制器
 */
export declare class LogController {
    private logService;
    constructor();
    /**
     * 获取操作日志
     */
    getLogs: (req: Request, res: Response) => Promise<void>;
    /**
     * 记录操作日志
     */
    addLog: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=LogController.d.ts.map