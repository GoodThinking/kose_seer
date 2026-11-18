"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration020CreateInvitations = void 0;
class Migration020CreateInvitations {
    version = 20;
    name = 'create_invitations';
    upSQLite() {
        return [`
      CREATE TABLE IF NOT EXISTS invitations (
        code_hash TEXT PRIMARY KEY NOT NULL,
        expires_at INTEGER NOT NULL,
        used_by INTEGER,
        used_at INTEGER,
        revoked_at INTEGER
      )
    `];
    }
    upMySQL() {
        return [`
      CREATE TABLE IF NOT EXISTS invitations (
        code_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
        expires_at BIGINT NOT NULL,
        used_by INT NULL,
        used_at BIGINT NULL,
        revoked_at BIGINT NULL
      ) ENGINE=InnoDB
    `];
    }
    downSQLite() { return ['DROP TABLE IF EXISTS invitations']; }
    downMySQL() { return ['DROP TABLE IF EXISTS invitations']; }
}
exports.Migration020CreateInvitations = Migration020CreateInvitations;
//# sourceMappingURL=020_create_invitations.js.map