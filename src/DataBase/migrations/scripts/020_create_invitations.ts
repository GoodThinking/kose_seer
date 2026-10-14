import { IMigration } from '../IMigration';

export class Migration020CreateInvitations implements IMigration {
  version = 20;
  name = 'create_invitations';

  upSQLite(): string[] {
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

  upMySQL(): string[] {
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

  downSQLite(): string[] { return ['DROP TABLE IF EXISTS invitations']; }
  downMySQL(): string[] { return ['DROP TABLE IF EXISTS invitations']; }
}
