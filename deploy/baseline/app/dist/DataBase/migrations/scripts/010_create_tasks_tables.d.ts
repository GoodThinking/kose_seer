/**
 * 创建任务系统相关表
 * - tasks: 任务数据表（JSON格式存储）
 */
import { IMigration } from '../IMigration';
export declare class Migration010CreateTasksTables implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=010_create_tasks_tables.d.ts.map