import { IMigration } from '../IMigration';
export class Migration021CreateReceiverClaims implements IMigration {
  version = 21;
  name = 'create_receiver_claims';
  upSQLite(): string[] {
    return [`CREATE TABLE IF NOT EXISTS receiver_claims (
      owner_id INTEGER NOT NULL, reward_key TEXT NOT NULL, period_start INTEGER NOT NULL,
      claimed_at INTEGER NOT NULL, amount INTEGER NOT NULL,
      PRIMARY KEY (owner_id, reward_key, period_start)
    )`];
  }
  upMySQL(): string[] {
    return [`CREATE TABLE IF NOT EXISTS receiver_claims (
      owner_id INT NOT NULL, reward_key VARCHAR(32) NOT NULL, period_start BIGINT NOT NULL,
      claimed_at BIGINT NOT NULL, amount INT NOT NULL,
      PRIMARY KEY (owner_id, reward_key, period_start)
    ) ENGINE=InnoDB`];
  }
  downSQLite(): string[] { return ['DROP TABLE IF EXISTS receiver_claims']; }
  downMySQL(): string[] { return ['DROP TABLE IF EXISTS receiver_claims']; }
}
