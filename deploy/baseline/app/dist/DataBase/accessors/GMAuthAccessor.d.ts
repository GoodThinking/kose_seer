/**
 * GM 认证访问器
 * 提供 GM 认证相关的数据库操作
 */
export interface GMWhitelistEntry {
    userId: number;
    email: string;
    permissions: string[];
    createdAt: number;
    createdBy: number;
    note?: string;
}
export interface GMSession {
    token: string;
    userId: number;
    email: string;
    ipAddress: string;
    createdAt: number;
    expiresAt: number;
}
/**
 * GM 认证访问器
 */
export declare class GMAuthAccessor {
    private static _instance;
    private constructor();
    static get Instance(): GMAuthAccessor;
    /**
     * 验证账号密码（使用邮箱登录）
     */
    ValidateAccount(email: string, password: string): Promise<{
        id: number;
        email: string;
    } | null>;
    /**
     * 创建 GM Session
     */
    CreateSession(token: string, userId: number, email: string, ipAddress: string, expiresAt: number): Promise<void>;
    /**
     * 验证 Session Token
     */
    ValidateSession(token: string): Promise<{
        userId: number;
        email: string;
    } | null>;
    /**
     * 删除 Session
     */
    DeleteSession(token: string): Promise<void>;
    /**
     * 检查用户是否在白名单中
     */
    IsInWhitelist(userId: number): Promise<boolean>;
    /**
     * 检查用户是否有指定权限
     */
    HasPermission(userId: number, permission: string): Promise<boolean>;
    /**
     * 获取白名单列表
     */
    GetWhitelist(): Promise<GMWhitelistEntry[]>;
    /**
     * 添加到白名单
     */
    AddToWhitelist(userId: number, email: string, permissions: string[], createdBy: number, note?: string): Promise<void>;
    /**
     * 从白名单移除
     */
    RemoveFromWhitelist(userId: number): Promise<void>;
    /**
     * 清理过期的 Session
     */
    CleanExpiredSessions(): Promise<void>;
}
//# sourceMappingURL=GMAuthAccessor.d.ts.map