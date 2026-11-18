"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration018CreateChallengeProgressTable = void 0;
class Migration018CreateChallengeProgressTable {
    version = 18;
    name = 'create_challenge_progress_table';
    upMySQL() {
        return [`
      CREATE TABLE IF NOT EXISTS player_challenge_progress (
        user_id INT PRIMARY KEY COMMENT '用户ID',
        boss_achievement BLOB COMMENT 'SPT BOSS击败记录（200字节，每字节0/1表示未击败/已击败）',
        max_puni_lv TINYINT NOT NULL DEFAULT 0 COMMENT '谱尼封印进度（0-8：0=未开启，1-7=封印进度，8=解锁真身）',
        tower_boss_index TINYINT NOT NULL DEFAULT 0 COMMENT '勇者之塔当前层已击败的BOSS数（0/1/2）',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
        INDEX idx_max_puni_lv (max_puni_lv),
        INDEX idx_tower_boss_index (tower_boss_index),
        FOREIGN KEY (user_id) REFERENCES players(user_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='玩家挑战进度表'
    `, `
      -- 从 players 表迁移现有数据（如果存在 max_puni_lv 字段）
      INSERT INTO player_challenge_progress (user_id, max_puni_lv)
      SELECT user_id, COALESCE(max_puni_lv, 0)
      FROM players
      WHERE user_id NOT IN (SELECT user_id FROM player_challenge_progress)
      ON DUPLICATE KEY UPDATE max_puni_lv = VALUES(max_puni_lv)
    `];
    }
    upSQLite() {
        return [`
      CREATE TABLE IF NOT EXISTS player_challenge_progress (
        user_id INTEGER PRIMARY KEY,
        boss_achievement BLOB,
        max_puni_lv INTEGER NOT NULL DEFAULT 0,
        tower_boss_index INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES players(user_id) ON DELETE CASCADE
      )
    `, `
      CREATE INDEX IF NOT EXISTS idx_challenge_max_puni_lv ON player_challenge_progress(max_puni_lv)
    `, `
      CREATE INDEX IF NOT EXISTS idx_challenge_tower_boss_index ON player_challenge_progress(tower_boss_index)
    `, `
      -- 初始化所有玩家的挑战进度记录（SQLite 无法在同一条 SQL 中安全引用可能不存在的列）
      INSERT OR IGNORE INTO player_challenge_progress (user_id, max_puni_lv)
      SELECT user_id, 0
      FROM players
    `];
    }
    downMySQL() {
        return ['DROP TABLE IF EXISTS player_challenge_progress'];
    }
    downSQLite() {
        return ['DROP TABLE IF EXISTS player_challenge_progress'];
    }
}
exports.Migration018CreateChallengeProgressTable = Migration018CreateChallengeProgressTable;
//# sourceMappingURL=018_create_challenge_progress_table.js.map