import { IMigration } from '../IMigration';

export class Migration022CreateRewardBoosts implements IMigration {
  version = 22;
  name = 'create_reward_boosts';
  upSQLite(): string[] {
    return [`CREATE TABLE IF NOT EXISTS player_reward_boosts (
      owner_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      multiplier INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY (owner_id, kind)
    )`];
  }
  upMySQL(): string[] {
    return [`CREATE TABLE IF NOT EXISTS player_reward_boosts (
      owner_id INT NOT NULL,
      kind VARCHAR(16) NOT NULL,
      multiplier INT NOT NULL,
      expires_at BIGINT NOT NULL,
      PRIMARY KEY (owner_id, kind)
    ) ENGINE=InnoDB`];
  }
  downSQLite(): string[] { return ['DROP TABLE IF EXISTS player_reward_boosts']; }
  downMySQL(): string[] { return ['DROP TABLE IF EXISTS player_reward_boosts']; }
}
