import { Request, Response } from 'express';
/**
 * 服务器管理控制器
 */
export declare class ServerController {
    private serverService;
    constructor();
    /**
     * 获取服务器状态
     */
    getStatus: (req: Request, res: Response) => Promise<void>;
    /**
     * 全服公告
     */
    sendAnnouncement: (req: Request, res: Response) => Promise<void>;
    /**
     * 服务器维护
     */
    maintenance: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=ServerController.d.ts.map