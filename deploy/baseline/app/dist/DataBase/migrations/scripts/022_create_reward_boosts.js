"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration022CreateRewardBoosts = void 0;
class Migration022CreateRewardBoosts {
    version = 22;
    name = 'create_reward_boosts';
    upSQLite() {
        return [`CREATE TABLE IF NOT EXISTS player_reward_boosts (
      owner_id INTEGER NOT NULL,
      kind TEXT NOT NULL,
      multiplier INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY (owner_id, kind)
    )`];
    }
    upMySQL() {
        return [`CREATE TABLE IF NOT EXISTS player_reward_boosts (
      owner_id INT NOT NULL,
      kind VARCHAR(16) NOT NULL,
      multiplier INT NOT NULL,
      expires_at BIGINT NOT NULL,
      PRIMARY KEY (owner_id, kind)
    ) ENGINE=InnoDB`];
    }
    downSQLite() { return ['DROP TABLE IF EXISTS player_reward_boosts']; }
    downMySQL() { return ['DROP TABLE IF EXISTS player_reward_boosts']; }
}
exports.Migration022CreateRewardBoosts = Migration022CreateRewardBoosts;
//# sourceMappingURL=022_create_reward_boosts.js.map