/**
 * 迁移脚本: 创建会话表
 */
import { IMigration } from '../IMigration';
export declare class Migration002CreateSessions implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=002_create_sessions.d.ts.map