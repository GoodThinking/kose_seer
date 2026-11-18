import { Request, Response } from 'express';
/**
 * 认证控制器
 */
export declare class AuthController {
    private authService;
    constructor();
    /**
     * 登录
     */
    login: (req: Request, res: Response) => Promise<void>;
    /**
     * 登出
     */
    logout: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取当前用户信息
     */
    getCurrentUser: (req: Request, res: Response) => Promise<void>;
    /**
     * 获取白名单列表
     */
    getWhitelist: (req: Request, res: Response) => Promise<void>;
    /**
     * 添加白名单
     */
    addToWhitelist: (req: Request, res: Response) => Promise<void>;
    /**
     * 移除白名单
     */
    removeFromWhitelist: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map