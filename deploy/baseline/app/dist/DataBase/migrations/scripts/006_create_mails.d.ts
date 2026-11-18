/**
 * 创建邮件表
 */
import { IMigration } from '../IMigration';
export declare class Migration011CreateMails implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=006_create_mails.d.ts.map