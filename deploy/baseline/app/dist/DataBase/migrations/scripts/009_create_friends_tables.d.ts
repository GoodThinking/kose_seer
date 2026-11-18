/**
 * 创建好友系统相关表
 * - friends: 好友关系表
 * - blacklist: 黑名单表
 */
import { IMigration } from '../IMigration';
export declare class Migration009CreateFriendsTables implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=009_create_friends_tables.d.ts.map