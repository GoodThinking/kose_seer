/**
 * 迁移脚本: 创建邮箱验证码表
 */
import { IMigration } from '../IMigration';
export declare class Migration005CreateEmailCodes implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=005_create_email_codes.d.ts.map