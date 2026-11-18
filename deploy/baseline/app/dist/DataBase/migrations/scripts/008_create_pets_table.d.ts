/**
 * 迁移脚本: 创建精灵表
 */
import { IMigration } from '../IMigration';
export declare class Migration008CreatePetsTable implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=008_create_pets_table.d.ts.map