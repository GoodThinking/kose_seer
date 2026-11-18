/**
 * 迁移脚本: 创建物品表
 */
import { IMigration } from '../IMigration';
export declare class Migration006CreateItems implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=006_create_items.d.ts.map