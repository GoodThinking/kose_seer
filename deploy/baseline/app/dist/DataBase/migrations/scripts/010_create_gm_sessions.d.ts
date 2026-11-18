/**
 * 迁移脚本: 创建 GM 会话表
 */
import { IMigration } from '../IMigration';
export declare class Migration010CreateGMSessions implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=010_create_gm_sessions.d.ts.map