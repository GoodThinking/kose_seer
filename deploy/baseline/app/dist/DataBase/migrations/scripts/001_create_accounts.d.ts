/**
 * 迁移脚本: 创建账号表
 */
import { IMigration } from '../IMigration';
export declare class Migration001CreateAccounts implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=001_create_accounts.d.ts.map