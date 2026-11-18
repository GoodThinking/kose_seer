"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationRepository = void 0;
const crypto_1 = require("crypto");
const DatabaseManager_1 = require("../../DatabaseManager");
const models_1 = require("../../../shared/models");
/** Stores only digests. Account creation and invitation consumption share one commit. */
class InvitationRepository {
    db = DatabaseManager_1.DatabaseManager.Instance;
    async Create(ttlSeconds) {
        if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0 || ttlSeconds > 31536000) {
            throw new Error('Invalid invitation lifetime');
        }
        const code = (0, crypto_1.randomBytes)(16).toString('hex');
        const hash = (0, crypto_1.createHash)('sha256').update(code).digest('hex');
        const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
        await this.db.Execute('INSERT INTO invitations (code_hash, expires_at) VALUES (?, ?)', [hash, expiresAt]);
        return { code, hash, expiresAt };
    }
    async Revoke(hash) {
        this.ValidateHash(hash);
        const result = await this.db.Execute('UPDATE invitations SET revoked_at = ? WHERE code_hash = ? AND used_by IS NULL AND revoked_at IS NULL', [Math.floor(Date.now() / 1000), hash]);
        return result.affectedRows === 1;
    }
    async Status(hash) {
        this.ValidateHash(hash);
        const rows = await this.db.Query('SELECT code_hash, expires_at, used_by, used_at, revoked_at FROM invitations WHERE code_hash = ?', [hash]);
        return rows[0] ?? null;
    }
    async Register(email, passwordHash, code) {
        code = code.trim().toLowerCase();
        if (!/^[0-9a-f]{32}$/.test(code))
            return { kind: 'invalid' };
        const hash = (0, crypto_1.createHash)('sha256').update(code).digest('hex');
        return this.db.Transaction(async (driver) => {
            const now = Math.floor(Date.now() / 1000);
            // FOR UPDATE also serializes this code across MySQL transaction connections.
            const lock = this.db.DatabaseType === 'mysql' ? ' FOR UPDATE' : '';
            const invitations = await driver.query('SELECT expires_at, used_by, revoked_at FROM invitations WHERE code_hash = ?' + lock, [hash]);
            const invite = invitations[0];
            if (!invite || invite.used_by !== null || invite.revoked_at !== null || invite.expires_at <= now) {
                return { kind: 'invalid' };
            }
            const userId = await this.CreateAccount(driver, email, passwordHash, now);
            if (!userId)
                return { kind: 'account_exists' };
            const used = await driver.execute('UPDATE invitations SET used_by = ?, used_at = ? WHERE code_hash = ? AND used_by IS NULL AND revoked_at IS NULL AND expires_at > ?', [userId, now, hash, now]);
            if (used.affectedRows !== 1)
                throw new Error('Invitation changed during registration');
            return { kind: 'created', userId };
        });
    }
    /** Allowlisted emails (server.json regist.allowEmails) register without consuming an invitation. */
    async RegisterAllowed(email, passwordHash) {
        return this.db.Transaction(async (driver) => {
            const userId = await this.CreateAccount(driver, email, passwordHash, Math.floor(Date.now() / 1000));
            return userId ? { kind: 'created', userId } : { kind: 'account_exists' };
        });
    }
    /** Returns the new account ID, or 0 when the email is already registered. */
    async CreateAccount(driver, email, passwordHash, now) {
        const existing = await driver.query('SELECT id FROM accounts WHERE email = ?', [email]);
        if (existing.length)
            return 0;
        const rows = await driver.query('SELECT COALESCE(MAX(id), 99999999) AS maxId FROM accounts');
        const userId = Math.max(Number(rows[0].maxId) + 1, 100000000);
        if (!Number.isSafeInteger(userId) || userId > 0x7FFFFFFF)
            throw new Error('Account ID exhausted');
        const account = await driver.execute('INSERT INTO accounts (id, email, password_hash, status, create_time, last_login_time, last_login_ip, role_created) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [userId, email, passwordHash, models_1.AccountStatus.NORMAL, now, 0, '', 0]);
        if (account.affectedRows !== 1)
            throw new Error('Account creation failed');
        return userId;
    }
    ValidateHash(hash) {
        if (!/^[0-9a-f]{64}$/.test(hash))
            throw new Error('Invalid invitation hash');
    }
}
exports.InvitationRepository = InvitationRepository;
//# sourceMappingURL=InvitationRepository.js.map