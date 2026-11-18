/**
 * 迁移脚本: 添加 cloth_ids 字段到 players 表
 * 用于保存玩家当前穿戴的服装ID列表
 */
import { IMigration } from '../IMigration';
export declare class Migration017AddClothIds implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=017_add_cloth_ids.d.ts.map