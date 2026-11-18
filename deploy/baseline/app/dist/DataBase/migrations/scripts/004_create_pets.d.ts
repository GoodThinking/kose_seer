/**
 * 迁移脚本: 创建精灵表
 */
import { IMigration } from '../IMigration';
export declare class Migration004CreatePets implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=004_create_pets.d.ts.map