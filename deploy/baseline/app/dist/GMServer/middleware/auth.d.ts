import { Request, Response, NextFunction } from 'express';
/**
 * GM 基础认证中间件
 * - 本地模式（配置 localMode=true）：无需认证
 * - 远程模式（配置 localMode=false）：需要 token
 */
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * 白名单权限中间件
 * 需要用户在白名单中，并且有指定权限
 */
export declare function whitelistMiddleware(permission: string): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=auth.d.ts.map