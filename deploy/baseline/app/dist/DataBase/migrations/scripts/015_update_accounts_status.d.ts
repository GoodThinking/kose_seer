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
export declare class UpdateAccountsStatus implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=015_update_accounts_status.d.ts.map