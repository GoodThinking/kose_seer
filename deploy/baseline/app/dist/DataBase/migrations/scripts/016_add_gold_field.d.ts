/**
 * 迁移脚本: 添加金豆字段
 * 添加 gold 字段用于存储充值货币（金豆）
 */
import { IMigration } from '../IMigration';
export declare class Migration016AddGoldField implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=016_add_gold_field.d.ts.map