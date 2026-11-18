"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const GMAuthAccessor_1 = require("../../DataBase/accessors/GMAuthAccessor");
const Logger_1 = require("../../shared/utils/Logger");
const crypto_1 = __importDefault(require("crypto"));
/**
 * GM 认证服务
 */
class AuthService {
    accessor = GMAuthAccessor_1.GMAuthAccessor.Instance;
    /**
     * 验证用户登录并创建 GM Session
     */
    async login(email, password, ipAddress) {
        try {
            // 验证账号密码
            const account = await this.accessor.ValidateAccount(email, password);
            if (!account) {
                Logger_1.Logger.Warn(`[AuthService] 登录失败: 邮箱或密码错误 ${email}`);
                return null;
            }
            // 生成 token
            const token = this.generateToken();
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = now + 86400; // 24小时过期
            // 保存 session
            await this.accessor.CreateSession(token, account.id, account.email, ipAddress, expiresAt);
            Logger_1.Logger.Info(`[AuthService] 用户登录成功: ${email} (${account.id}) from ${ipAddress}`);
            return token;
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthService] 登录失败', error);
            return null;
        }
    }
    /**
     * 验证 token 并返回用户信息
     */
    async validateToken(token) {
        return this.accessor.ValidateSession(token);
    }
    /**
     * 登出
     */
    async logout(token) {
        try {
            await this.accessor.DeleteSession(token);
            Logger_1.Logger.Info(`[AuthService] 用户登出: token=${token.substring(0, 8)}...`);
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthService] 登出失败', error);
        }
    }
    /**
     * 检查用户是否在白名单中
     */
    async isInWhitelist(userId) {
        return this.accessor.IsInWhitelist(userId);
    }
    /**
     * 检查用户是否有指定权限
     */
    async hasPermission(userId, permission) {
        return this.accessor.HasPermission(userId, permission);
    }
    /**
     * 获取白名单列表
     */
    async getWhitelist() {
        return this.accessor.GetWhitelist();
    }
    /**
     * 添加白名单
     */
    async addToWhitelist(userId, email, permissions, createdBy, note) {
        await this.accessor.AddToWhitelist(userId, email, permissions, createdBy, note);
        Logger_1.Logger.Info(`[AuthService] 添加白名单: ${email} (${userId}), permissions=${permissions.join(',')}`);
    }
    /**
     * 从白名单移除
     */
    async removeFromWhitelist(userId) {
        await this.accessor.RemoveFromWhitelist(userId);
        Logger_1.Logger.Info(`[AuthService] 移除白名单: userId=${userId}`);
    }
    /**
     * 清理过期的 session
     */
    async cleanExpiredSessions() {
        await this.accessor.CleanExpiredSessions();
    }
    /**
     * 生成随机 token
     */
    generateToken() {
        return crypto_1.default.randomBytes(32).toString('hex');
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map