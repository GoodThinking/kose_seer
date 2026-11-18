/**
 * 迁移脚本: 创建 GM 白名单表
 */
import { IMigration } from '../IMigration';
export declare class Migration009CreateGMWhitelist implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=009_create_gm_whitelist.d.ts.map