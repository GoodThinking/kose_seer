"use strict";
/**
 * GM 认证访问器
 * 提供 GM 认证相关的数据库操作
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMAuthAccessor = void 0;
const DatabaseManager_1 = require("../DatabaseManager");
const utils_1 = require("../../shared/utils");
/**
 * GM 认证访问器
 */
class GMAuthAccessor {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!GMAuthAccessor._instance) {
            GMAuthAccessor._instance = new GMAuthAccessor();
        }
        return GMAuthAccessor._instance;
    }
    /**
     * 验证账号密码（使用邮箱登录）
     */
    async ValidateAccount(email, password) {
        try {
            const accounts = await DatabaseManager_1.DatabaseManager.Instance.Query('SELECT id, email, password_hash FROM accounts WHERE email = ?', [email]);
            if (accounts.length === 0) {
                return null;
            }
            const account = accounts[0];
            // 验证密码（这里假设传入的password已经是MD5哈希）
            // 如果前端传的是明文，需要在这里进行MD5哈希
            if (account.password_hash !== password) {
                return null;
            }
            return { id: account.id, email: account.email };
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 验证账号失败', error);
            return null;
        }
    }
    /**
     * 创建 GM Session
     */
    async CreateSession(token, userId, email, ipAddress, expiresAt) {
        try {
            const now = Math.floor(Date.now() / 1000);
            await DatabaseManager_1.DatabaseManager.Instance.Query(`INSERT INTO gm_sessions (token, user_id, email, ip_address, created_at, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`, [token, userId, email, ipAddress, now, expiresAt]);
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 创建Session失败', error);
            throw error;
        }
    }
    /**
     * 验证 Session Token
     */
    async ValidateSession(token) {
        try {
            const now = Math.floor(Date.now() / 1000);
            const sessions = await DatabaseManager_1.DatabaseManager.Instance.Query(`SELECT user_id, email FROM gm_sessions WHERE token = ? AND expires_at > ?`, [token, now]);
            if (sessions.length === 0) {
                return null;
            }
            return { userId: sessions[0].user_id, email: sessions[0].email };
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 验证Session失败', error);
            return null;
        }
    }
    /**
     * 删除 Session
     */
    async DeleteSession(token) {
        try {
            await DatabaseManager_1.DatabaseManager.Instance.Query('DELETE FROM gm_sessions WHERE token = ?', [token]);
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 删除Session失败', error);
            throw error;
        }
    }
    /**
     * 检查用户是否在白名单中
     */
    async IsInWhitelist(userId) {
        try {
            const entries = await DatabaseManager_1.DatabaseManager.Instance.Query('SELECT user_id FROM gm_whitelist WHERE user_id = ?', [userId]);
            return entries.length > 0;
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 检查白名单失败', error);
            return false;
        }
    }
    /**
     * 检查用户是否有指定权限
     */
    async HasPermission(userId, permission) {
        try {
            const entries = await DatabaseManager_1.DatabaseManager.Instance.Query('SELECT permissions FROM gm_whitelist WHERE user_id = ?', [userId]);
            if (entries.length === 0) {
                return false;
            }
            const permissions = JSON.parse(entries[0].permissions);
            return permissions.includes(permission) || permissions.includes('*');
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 检查权限失败', error);
            return false;
        }
    }
    /**
     * 获取白名单列表
     */
    async GetWhitelist() {
        try {
            const rows = await DatabaseManager_1.DatabaseManager.Instance.Query(`SELECT user_id, email, permissions, created_at, created_by, note
         FROM gm_whitelist
         ORDER BY created_at DESC`);
            return rows.map(row => ({
                userId: row.user_id,
                email: row.email,
                permissions: JSON.parse(row.permissions),
                createdAt: row.created_at,
                createdBy: row.created_by,
                note: row.note
            }));
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 获取白名单失败', error);
            return [];
        }
    }
    /**
     * 添加到白名单
     */
    async AddToWhitelist(userId, email, permissions, createdBy, note) {
        try {
            const now = Math.floor(Date.now() / 1000);
            await DatabaseManager_1.DatabaseManager.Instance.Query(`INSERT OR REPLACE INTO gm_whitelist (user_id, email, permissions, created_at, created_by, note)
         VALUES (?, ?, ?, ?, ?, ?)`, [userId, email, JSON.stringify(permissions), now, createdBy, note || '']);
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 添加白名单失败', error);
            throw error;
        }
    }
    /**
     * 从白名单移除
     */
    async RemoveFromWhitelist(userId) {
        try {
            await DatabaseManager_1.DatabaseManager.Instance.Query('DELETE FROM gm_whitelist WHERE user_id = ?', [userId]);
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 移除白名单失败', error);
            throw error;
        }
    }
    /**
     * 清理过期的 Session
     */
    async CleanExpiredSessions() {
        try {
            const now = Math.floor(Date.now() / 1000);
            await DatabaseManager_1.DatabaseManager.Instance.Query('DELETE FROM gm_sessions WHERE expires_at <= ?', [now]);
        }
        catch (error) {
            utils_1.Logger.Error('[GMAuthAccessor] 清理过期Session失败', error);
            throw error;
        }
    }
}
exports.GMAuthAccessor = GMAuthAccessor;
//# sourceMappingURL=GMAuthAccessor.js.map