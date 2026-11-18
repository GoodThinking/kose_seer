"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailCodeRepository = void 0;
/**
 * 邮箱验证码仓库
 */
const BaseRepository_1 = require("../BaseRepository");
const models_1 = require("../../../shared/models");
class EmailCodeRepository extends BaseRepository_1.BaseRepository {
    _tableName = 'email_codes';
    /**
     * 创建验证码
     */
    async CreateCode(email, expireSeconds = 300) {
        const codeInfo = (0, models_1.createEmailCodeInfo)(email, expireSeconds);
        await this._db.Execute(`INSERT INTO email_codes (email, code, code_res, create_time, expire_time, used)
       VALUES (?, ?, ?, ?, ?, ?)`, [codeInfo.email, codeInfo.code, codeInfo.codeRes, codeInfo.createTime, codeInfo.expireTime, 0]);
        return codeInfo;
    }
    /**
     * 根据验证码响应查找
     */
    async FindByCodeRes(codeRes) {
        const now = Math.floor(Date.now() / 1000);
        const rows = await this._db.Query('SELECT * FROM email_codes WHERE code_res = ? AND used = 0 AND expire_time > ? ORDER BY create_time DESC LIMIT 1', [codeRes, now]);
        if (rows.length === 0)
            return null;
        return this.toEmailCodeInfo(rows[0]);
    }
    /**
     * 验证验证码
     */
    async VerifyCode(email, code) {
        const now = Math.floor(Date.now() / 1000);
        const rows = await this._db.Query('SELECT * FROM email_codes WHERE email = ? AND code = ? AND used = 0 AND expire_time > ? ORDER BY create_time DESC LIMIT 1', [email, code, now]);
        if (rows.length === 0)
            return null;
        return this.toEmailCodeInfo(rows[0]);
    }
    /**
     * 标记验证码已使用
     */
    async MarkAsUsed(id) {
        const result = await this._db.Execute('UPDATE email_codes SET used = 1 WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
    /**
     * 根据邮箱标记所有验证码已使用
     */
    async MarkAllAsUsedByEmail(email) {
        const result = await this._db.Execute('UPDATE email_codes SET used = 1 WHERE email = ?', [email]);
        return result.affectedRows;
    }
    /**
     * 删除过期验证码
     */
    async DeleteExpired() {
        const now = Math.floor(Date.now() / 1000);
        const result = await this._db.Execute('DELETE FROM email_codes WHERE expire_time < ?', [now]);
        return result.affectedRows;
    }
    /**
     * 获取邮箱的未使用验证码数量
     */
    async GetUnusedCount(email) {
        const now = Math.floor(Date.now() / 1000);
        const rows = await this._db.Query('SELECT COUNT(*) as count FROM email_codes WHERE email = ? AND used = 0 AND expire_time > ?', [email, now]);
        return rows[0]?.count || 0;
    }
    /**
     * 检查是否可以发送新验证码（限制频率）
     */
    async CanSendCode(email, cooldownSeconds = 60) {
        const cooldownTime = Math.floor(Date.now() / 1000) - cooldownSeconds;
        const rows = await this._db.Query('SELECT COUNT(*) as count FROM email_codes WHERE email = ? AND create_time > ?', [email, cooldownTime]);
        return rows[0]?.count === 0;
    }
    /**
     * 转换为 IEmailCodeInfo
     */
    toEmailCodeInfo(row) {
        return {
            email: row.email,
            code: row.code,
            codeRes: row.code_res,
            createTime: row.create_time,
            expireTime: row.expire_time,
            used: row.used === 1
        };
    }
}
exports.EmailCodeRepository = EmailCodeRepository;
//# sourceMappingURL=EmailCodeRepository.js.map