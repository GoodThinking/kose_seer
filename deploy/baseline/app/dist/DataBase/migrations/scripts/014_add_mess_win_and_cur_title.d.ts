/**
 * 迁移脚本: 添加混战胜利次数字段
 * 注意: cur_title字段已在migration 003中创建，此迁移只添加mess_win
 * 注意: mess_win字段可能已存在（如果之前运行过此迁移），需要检查
 */
import { IMigration } from '../IMigration';
export declare class Migration014AddMessWinAndCurTitle implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=014_add_mess_win_and_cur_title.d.ts.map