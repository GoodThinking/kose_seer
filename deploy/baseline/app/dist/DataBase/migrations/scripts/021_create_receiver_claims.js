"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration021CreateReceiverClaims = void 0;
class Migration021CreateReceiverClaims {
    version = 21;
    name = 'create_receiver_claims';
    upSQLite() {
        return [`CREATE TABLE IF NOT EXISTS receiver_claims (
      owner_id INTEGER NOT NULL, reward_key TEXT NOT NULL, period_start INTEGER NOT NULL,
      claimed_at INTEGER NOT NULL, amount INTEGER NOT NULL,
      PRIMARY KEY (owner_id, reward_key, period_start)
    )`];
    }
    upMySQL() {
        return [`CREATE TABLE IF NOT EXISTS receiver_claims (
      owner_id INT NOT NULL, reward_key VARCHAR(32) NOT NULL, period_start BIGINT NOT NULL,
      claimed_at BIGINT NOT NULL, amount INT NOT NULL,
      PRIMARY KEY (owner_id, reward_key, period_start)
    ) ENGINE=InnoDB`];
    }
    downSQLite() { return ['DROP TABLE IF EXISTS receiver_claims']; }
    downMySQL() { return ['DROP TABLE IF EXISTS receiver_claims']; }
}
exports.Migration021CreateReceiverClaims = Migration021CreateReceiverClaims;
//# sourceMappingURL=021_create_receiver_claims.js.map