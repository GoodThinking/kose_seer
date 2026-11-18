/**
 * 迁移脚本: 创建挑战进度表
 *
 * 优化目标：
 * 1. 分离挑战进度数据，减少主表查询负担
 * 2. 使用 BLOB 存储数组数据，减少 JSON 序列化开销
 * 3. 支持独立索引和查询
 */
import { IMigration } from '../IMigration';
export declare class Migration018CreateChallengeProgressTable implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=018_create_challenge_progress_table.d.ts.map