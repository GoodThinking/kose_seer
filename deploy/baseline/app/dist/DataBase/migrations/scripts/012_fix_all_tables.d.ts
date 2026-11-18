/**
 * 迁移脚本: 修复所有表结构为 JSON 格式
 */
import { IMigration } from '../IMigration';
export declare class Migration012FixAllTables implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=012_fix_all_tables.d.ts.map