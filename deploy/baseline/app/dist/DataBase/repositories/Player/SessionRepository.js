"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRepository = void 0;
/**
 * 会话仓库
 */
const BaseRepository_1 = require("../BaseRepository");
const SessionToken_1 = require("../../../shared/protocol/SessionToken");
class SessionRepository extends BaseRepository_1.BaseRepository {
    _tableName = 'sessions';
    /**
     * 创建会话
     */
    async CreateSession(accountId, loginIP, serverId = 0, expireSeconds = 3600) {
        const now = Math.floor(Date.now() / 1000);
        const sessionKey = (0, SessionToken_1.NewSessionKey)();
        const expireTime = now + expireSeconds;
        await this._db.Execute(`INSERT INTO sessions (account_id, session_key, create_time, expire_time, login_ip, server_id, is_online)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, [accountId, sessionKey, now, expireTime, loginIP, serverId, 1]);
        return {
            sessionKey,
            accountId,
            createTime: now,
            expireTime,
            loginIP,
            serverId,
            isOnline: true
        };
    }
    /**
     * 根据会话密钥查找会话
     */
    async FindBySessionKey(sessionKey) {
        const rows = await this._db.Query('SELECT * FROM sessions WHERE session_key = ?', [sessionKey]);
        if (rows.length === 0)
            return null;
        return this.toSessionInfo(rows[0]);
    }
    /**
     * 根据账号ID查找有效会话
     */
    async FindValidByAccountId(accountId) {
        const now = Math.floor(Date.now() / 1000);
        const rows = await this._db.Query('SELECT * FROM sessions WHERE account_id = ? AND expire_time > ? AND is_online = 1 ORDER BY create_time DESC LIMIT 1', [accountId, now]);
        if (rows.length === 0)
            return null;
        return this.toSessionInfo(rows[0]);
    }
    /**
     * 验证会话
     */
    async ValidateSession(sessionKey, accountId) {
        const now = Math.floor(Date.now() / 1000);
        const rows = await this._db.Query('SELECT * FROM sessions WHERE session_key = ? AND account_id = ? AND expire_time > ? AND is_online = 1', [sessionKey, accountId, now]);
        if (rows.length !== 1)
            return null;
        return this.toSessionInfo(rows[0]);
    }
    /**
     * 更新在线状态
     */
    async UpdateOnlineStatus(sessionKey, isOnline) {
        const result = await this._db.Execute('UPDATE sessions SET is_online = ? WHERE session_key = ?', [isOnline ? 1 : 0, sessionKey]);
        return result.affectedRows > 0;
    }
    /**
     * 更新服务器ID
     */
    async UpdateServerId(sessionKey, serverId) {
        const result = await this._db.Execute('UPDATE sessions SET server_id = ? WHERE session_key = ?', [serverId, sessionKey]);
        return result.affectedRows > 0;
    }
    /**
     * 延长会话有效期
     */
    async ExtendSession(sessionKey, expireSeconds = 3600) {
        const now = Math.floor(Date.now() / 1000);
        const expireTime = now + expireSeconds;
        const result = await this._db.Execute('UPDATE sessions SET expire_time = ? WHERE session_key = ?', [expireTime, sessionKey]);
        return result.affectedRows > 0;
    }
    /**
     * 使账号的所有会话失效
     */
    async InvalidateAllByAccountId(accountId) {
        const result = await this._db.Execute('UPDATE sessions SET is_online = 0 WHERE account_id = ?', [accountId]);
        return result.affectedRows;
    }
    /**
     * 删除过期会话
     */
    async DeleteExpired() {
        const now = Math.floor(Date.now() / 1000);
        const result = await this._db.Execute('DELETE FROM sessions WHERE expire_time < ?', [now]);
        return result.affectedRows;
    }
    /**
     * 转换为 ISessionInfo
     */
    toSessionInfo(row) {
        return {
            sessionKey: row.session_key,
            accountId: row.account_id,
            createTime: row.create_time,
            expireTime: row.expire_time,
            loginIP: row.login_ip,
            serverId: row.server_id,
            isOnline: row.is_online === 1
        };
    }
}
exports.SessionRepository = SessionRepository;
//# sourceMappingURL=SessionRepository.js.map