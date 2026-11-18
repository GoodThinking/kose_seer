export interface GMWhitelistEntry {
    userId: number;
    email: string;
    permissions: string[];
    createdAt: number;
    createdBy: number;
    note?: string;
}
/**
 * GM 认证服务
 */
export declare class AuthService {
    private accessor;
    /**
     * 验证用户登录并创建 GM Session
     */
    login(email: string, password: string, ipAddress: string): Promise<string | null>;
    /**
     * 验证 token 并返回用户信息
     */
    validateToken(token: string): Promise<{
        userId: number;
        email: string;
    } | null>;
    /**
     * 登出
     */
    logout(token: string): Promise<void>;
    /**
     * 检查用户是否在白名单中
     */
    isInWhitelist(userId: number): Promise<boolean>;
    /**
     * 检查用户是否有指定权限
     */
    hasPermission(userId: number, permission: string): Promise<boolean>;
    /**
     * 获取白名单列表
     */
    getWhitelist(): Promise<GMWhitelistEntry[]>;
    /**
     * 添加白名单
     */
    addToWhitelist(userId: number, email: string, permissions: string[], createdBy: number, note?: string): Promise<void>;
    /**
     * 从白名单移除
     */
    removeFromWhitelist(userId: number): Promise<void>;
    /**
     * 清理过期的 session
     */
    cleanExpiredSessions(): Promise<void>;
    /**
     * 生成随机 token
     */
    private generateToken;
}
//# sourceMappingURL=AuthService.d.ts.map