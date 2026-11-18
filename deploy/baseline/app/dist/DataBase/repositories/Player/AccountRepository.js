"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountRepository = void 0;
/**
 * 账号仓库
 */
const BaseRepository_1 = require("../BaseRepository");
const models_1 = require("../../../shared/models");
class AccountRepository extends BaseRepository_1.BaseRepository {
    _tableName = 'accounts';
    /**
     * 根据邮箱查找账号
     */
    async FindByEmail(email) {
        const rows = await this._db.Query('SELECT * FROM accounts WHERE email = ?', [email]);
        if (rows.length === 0)
            return null;
        return this.toAccountInfo(rows[0]);
    }
    /**
     * 根据ID查找账号
     */
    async FindAccountById(id) {
        const rows = await this._db.Query('SELECT * FROM accounts WHERE id = ?', [id]);
        if (rows.length === 0)
            return null;
        return this.toAccountInfo(rows[0]);
    }
    /**
     * 创建账号
     * 用户ID从 100000000 开始
     */
    async CreateAccount(email, passwordHash) {
        const now = Math.floor(Date.now() / 1000);
        // 获取当前最大ID
        const maxIdRows = await this._db.Query('SELECT COALESCE(MAX(id), 99999999) as maxId FROM accounts');
        const maxId = maxIdRows[0]?.maxId || 99999999;
        // 新用户ID = max(当前最大ID + 1, 100000000)
        const newUserId = Math.max(maxId + 1, 100000000);
        const result = await this._db.Execute(`INSERT INTO accounts (id, email, password_hash, status, create_time, last_login_time, last_login_ip, role_created)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [newUserId, email, passwordHash, models_1.AccountStatus.NORMAL, now, 0, '', 0]);
        return newUserId;
    }
    /**
     * 更新最后登录信息
     */
    async UpdateLastLogin(id, ip) {
        const now = Math.floor(Date.now() / 1000);
        const result = await this._db.Execute('UPDATE accounts SET last_login_time = ?, last_login_ip = ? WHERE id = ?', [now, ip, id]);
        return result.affectedRows > 0;
    }
    /**
     * 更新角色创建状态
     */
    async UpdateRoleCreated(id, created) {
        const result = await this._db.Execute('UPDATE accounts SET role_created = ? WHERE id = ?', [created ? 1 : 0, id]);
        return result.affectedRows > 0;
    }
    /**
     * 更新账号状态
     */
    async UpdateStatus(id, status) {
        const result = await this._db.Execute('UPDATE accounts SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
    }
    /**
     * 更新密码
     */
    async UpdatePassword(id, passwordHash) {
        const result = await this._db.Execute('UPDATE accounts SET password_hash = ? WHERE id = ?', [passwordHash, id]);
        return result.affectedRows > 0;
    }
    /**
     * 检查邮箱是否已存在
     */
    async EmailExists(email) {
        const rows = await this._db.Query('SELECT COUNT(*) as count FROM accounts WHERE email = ?', [email]);
        return rows[0]?.count > 0;
    }
    /**
     * 验证密码
     */
    async VerifyPassword(email, passwordHash) {
        const rows = await this._db.Query('SELECT * FROM accounts WHERE email = ? AND password_hash = ?', [email, passwordHash]);
        if (rows.length === 0)
            return null;
        return this.toAccountInfo(rows[0]);
    }
    /**
     * 转换为 IAccountInfo
     */
    toAccountInfo(row) {
        return {
            id: row.id,
            email: row.email,
            passwordHash: row.password_hash,
            status: row.status,
            createTime: row.create_time,
            lastLoginTime: row.last_login_time,
            lastLoginIP: row.last_login_ip,
            roleCreated: row.role_created === 1
        };
    }
}
exports.AccountRepository = AccountRepository;
//# sourceMappingURL=AccountRepository.js.map