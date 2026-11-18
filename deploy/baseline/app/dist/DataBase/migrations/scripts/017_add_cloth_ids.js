"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration017AddClothIds = void 0;
class Migration017AddClothIds {
    version = 17;
    name = 'add_cloth_ids';
    upMySQL() {
        return [`
      ALTER TABLE players 
      ADD COLUMN cloth_ids TEXT DEFAULT '[]' COMMENT '当前穿戴的服装ID列表（JSON数组）'
    `];
    }
    upSQLite() {
        return [`
      ALTER TABLE players 
      ADD COLUMN cloth_ids TEXT DEFAULT '[]'
    `];
    }
    downMySQL() {
        return ['ALTER TABLE players DROP COLUMN cloth_ids'];
    }
    downSQLite() {
        // SQLite 不支持 DROP COLUMN，需要重建表
        return [
            'ALTER TABLE players RENAME TO players_old',
            `CREATE TABLE players AS SELECT 
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture,
        energy, coins, gold, fight_badge, allocatable_exp, map_id, pos_x, pos_y,
        time_today, time_limit, login_cnt, inviter, vip_level, vip_value, vip_stage,
        vip_end_time, teacher_id, student_id, graduation_count, pet_max_lev, pet_all_num,
        mon_king_win, mess_win, cur_stage, max_stage, cur_fresh_stage, max_fresh_stage,
        max_arena_wins, has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai, nono_birth, nono_charge_time,
        nono_super_energy, nono_super_level, nono_super_stage, badge, cur_title, team_id
      FROM players_old`,
            'DROP TABLE players_old'
        ];
    }
}
exports.Migration017AddClothIds = Migration017AddClothIds;
//# sourceMappingURL=017_add_cloth_ids.js.map