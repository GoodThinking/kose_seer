/**
 * 迁移脚本: 添加金豆字段
 * 添加 gold 字段用于存储充值货币（金豆）
 */
import { IMigration } from '../IMigration';

export class Migration016AddGoldField implements IMigration {
  version = 16;
  name = 'add_gold_field';

  upMySQL(): string[] {
    return [
      `ALTER TABLE players ADD COLUMN gold INT NOT NULL DEFAULT 0 COMMENT '金豆（充值货币）' AFTER coins`
    ];
  }

  upSQLite(): string[] {
    return [
      `ALTER TABLE players ADD COLUMN gold INTEGER NOT NULL DEFAULT 0`
    ];
  }

  downMySQL(): string[] {
    return [
      'ALTER TABLE players DROP COLUMN gold'
    ];
  }

  downSQLite(): string[] {
    // SQLite 不支持 DROP COLUMN，需要重建表
    return [
      `CREATE TABLE players_backup AS SELECT 
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture, energy, coins,
        fight_badge, map_id, pos_x, pos_y, time_today, time_limit, login_cnt, inviter,
        vip_level, vip_value, vip_stage, vip_end_time, teacher_id, student_id,
        graduation_count, pet_max_lev, pet_all_num, mon_king_win, cur_stage, max_stage,
        max_arena_wins, has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai, nono_super_level,
        nono_bio, nono_birth, nono_charge_time, nono_expire, nono_chip, nono_grow,
        badge, cur_title, team_id, extra_data, allocatable_exp, mess_win
      FROM players`,
      'DROP TABLE players',
      `CREATE TABLE players (
        user_id INTEGER PRIMARY KEY,
        nick TEXT NOT NULL,
        reg_time INTEGER NOT NULL,
        vip INTEGER NOT NULL DEFAULT 0,
        viped INTEGER NOT NULL DEFAULT 0,
        ds_flag INTEGER NOT NULL DEFAULT 0,
        color INTEGER NOT NULL DEFAULT 0,
        texture INTEGER NOT NULL DEFAULT 0,
        energy INTEGER NOT NULL DEFAULT 100,
        coins INTEGER NOT NULL DEFAULT 1000,
        fight_badge INTEGER NOT NULL DEFAULT 0,
        map_id INTEGER NOT NULL DEFAULT 515,
        pos_x INTEGER NOT NULL DEFAULT 300,
        pos_y INTEGER NOT NULL DEFAULT 300,
        time_today INTEGER NOT NULL DEFAULT 0,
        time_limit INTEGER NOT NULL DEFAULT 0,
        login_cnt INTEGER NOT NULL DEFAULT 1,
        inviter INTEGER NOT NULL DEFAULT 0,
        vip_level INTEGER NOT NULL DEFAULT 0,
        vip_value INTEGER NOT NULL DEFAULT 0,
        vip_stage INTEGER NOT NULL DEFAULT 1,
        vip_end_time INTEGER NOT NULL DEFAULT 0,
        teacher_id INTEGER NOT NULL DEFAULT 0,
        student_id INTEGER NOT NULL DEFAULT 0,
        graduation_count INTEGER NOT NULL DEFAULT 0,
        pet_max_lev INTEGER NOT NULL DEFAULT 0,
        pet_all_num INTEGER NOT NULL DEFAULT 0,
        mon_king_win INTEGER NOT NULL DEFAULT 0,
        cur_stage INTEGER NOT NULL DEFAULT 1,
        max_stage INTEGER NOT NULL DEFAULT 0,
        max_arena_wins INTEGER NOT NULL DEFAULT 0,
        has_nono INTEGER NOT NULL DEFAULT 0,
        super_nono INTEGER NOT NULL DEFAULT 0,
        nono_state INTEGER NOT NULL DEFAULT 0,
        nono_color INTEGER NOT NULL DEFAULT 0,
        nono_nick TEXT NOT NULL DEFAULT '',
        nono_flag INTEGER NOT NULL DEFAULT 1,
        nono_power INTEGER NOT NULL DEFAULT 10000,
        nono_mate INTEGER NOT NULL DEFAULT 10000,
        nono_iq INTEGER NOT NULL DEFAULT 0,
        nono_ai INTEGER NOT NULL DEFAULT 0,
        nono_super_level INTEGER NOT NULL DEFAULT 0,
        nono_bio INTEGER NOT NULL DEFAULT 0,
        nono_birth INTEGER NOT NULL DEFAULT 0,
        nono_charge_time INTEGER NOT NULL DEFAULT 0,
        nono_expire INTEGER NOT NULL DEFAULT 0,
        nono_chip INTEGER NOT NULL DEFAULT 0,
        nono_grow INTEGER NOT NULL DEFAULT 0,
        badge INTEGER NOT NULL DEFAULT 0,
        cur_title INTEGER NOT NULL DEFAULT 0,
        team_id INTEGER NOT NULL DEFAULT 0,
        extra_data TEXT,
        allocatable_exp INTEGER NOT NULL DEFAULT 0,
        mess_win INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE
      )`,
      `INSERT INTO players SELECT 
        user_id, nick, reg_time, vip, viped, ds_flag, color, texture, energy, coins,
        fight_badge, map_id, pos_x, pos_y, time_today, time_limit, login_cnt, inviter,
        vip_level, vip_value, vip_stage, vip_end_time, teacher_id, student_id,
        graduation_count, pet_max_lev, pet_all_num, mon_king_win, cur_stage, max_stage,
        max_arena_wins, has_nono, super_nono, nono_state, nono_color, nono_nick,
        nono_flag, nono_power, nono_mate, nono_iq, nono_ai, nono_super_level,
        nono_bio, nono_birth, nono_charge_time, nono_expire, nono_chip, nono_grow,
        badge, cur_title, team_id, extra_data, allocatable_exp, mess_win
      FROM players_backup`,
      'DROP TABLE players_backup',
      'CREATE INDEX IF NOT EXISTS idx_players_nick ON players(nick)',
      'CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id)'
    ];
  }
}
