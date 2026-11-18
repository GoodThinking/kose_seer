import { IMigration } from '../IMigration';

/**
 * 更新 accounts 表的 status 字段注释
 * 
 * 封禁状态定义：
 * 0 = 正常
 * 1 = 24小时封停
 * 2 = 7天封停
 * 3 = 14天封停
 * 4 = 永久封停
 */
export class UpdateAccountsStatus implements IMigration {
version = 15;
  name = '015_update_accounts_status';

  upMySQL(): string[] {
    return [`
      ALTER TABLE accounts 
      MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 
      COMMENT '状态: 0=正常, 1=24小时封停, 2=7天封停, 3=14天封停, 4=永久封停'
    `];
  }

  upSQLite(): string[] {
    // SQLite 不支持修改列注释，但字段本身已经支持 0-4 的值
    // 只需要确保没有约束限制
    return [
      `-- SQLite accounts.status 字段已支持 0-4 的值`,
      `-- 0=正常, 1=24小时封停, 2=7天封停, 3=14天封停, 4=永久封停`
    ];
  }

  downMySQL(): string[] {
    return [`
      ALTER TABLE accounts 
      MODIFY COLUMN status TINYINT NOT NULL DEFAULT 0 
      COMMENT '状态: 0正常, 1封禁, 2冻结, 3待激活'
    `];
  }

  downSQLite(): string[] {
    return [`-- Rollback: 恢复原注释说明`];
  }
}
