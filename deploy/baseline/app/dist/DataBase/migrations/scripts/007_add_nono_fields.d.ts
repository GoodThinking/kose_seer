/**
 * 迁移脚本: 添加完整的 NoNo 字段
 */
import { IMigration } from '../IMigration';
export declare class Migration007AddNoNoFields implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=007_add_nono_fields.d.ts.map