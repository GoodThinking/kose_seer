/**
 * 迁移脚本: 添加精灵分配仪可分配经验字段
 */
import { IMigration } from '../IMigration';
export declare class Migration013AddAllocatableExp implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=013_add_allocatable_exp.d.ts.map