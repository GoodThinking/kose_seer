"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration019AddChallengeFieldsToPlayers = void 0;
class Migration019AddChallengeFieldsToPlayers {
    version = 19;
    name = 'add_challenge_fields_to_players';
    upMySQL() {
        return [`
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS max_puni_lv TINYINT NOT NULL DEFAULT 0 
      COMMENT '谱尼封印进度（0-8：0=未开启，1-7=封印进度，8=解锁真身）'
      AFTER graduation_count
    `, `
      ALTER TABLE players 
      ADD COLUMN IF NOT EXISTS tower_boss_index TINYINT NOT NULL DEFAULT 0 
      COMMENT '勇者之塔当前层已击败的BOSS数（0/1/2）'
      AFTER max_puni_lv
    `];
    }
    upSQLite() {
        return [
            'ALTER TABLE players ADD COLUMN max_puni_lv INTEGER NOT NULL DEFAULT 0',
            'ALTER TABLE players ADD COLUMN tower_boss_index INTEGER NOT NULL DEFAULT 0'
        ];
    }
    downMySQL() {
        return [
            'ALTER TABLE players DROP COLUMN IF EXISTS tower_boss_index',
            'ALTER TABLE players DROP COLUMN IF EXISTS max_puni_lv'
        ];
    }
    downSQLite() {
        return [
            // SQLite 不支持 DROP COLUMN，需要重建表
            'SELECT 1' // 占位符
        ];
    }
}
exports.Migration019AddChallengeFieldsToPlayers = Migration019AddChallengeFieldsToPlayers;
//# sourceMappingURL=019_add_challenge_fields_to_players.js.map