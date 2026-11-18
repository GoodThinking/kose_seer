"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration010CreateTasksTables = void 0;
class Migration010CreateTasksTables {
    version = 10;
    name = 'create_tasks_tables';
    upMySQL() {
        return [
            `CREATE TABLE IF NOT EXISTS tasks (
        user_id INT PRIMARY KEY COMMENT '用户ID',
        task_list TEXT NOT NULL DEFAULT '{}' COMMENT '任务列表（JSON格式）',
        task_buffers TEXT NOT NULL DEFAULT '{}' COMMENT '任务缓存（JSON格式）'
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务数据表'`,
            `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`
        ];
    }
    upSQLite() {
        return [
            `CREATE TABLE IF NOT EXISTS tasks (
        user_id INTEGER PRIMARY KEY,
        task_list TEXT NOT NULL DEFAULT '{}',
        task_buffers TEXT NOT NULL DEFAULT '{}'
      )`,
            `CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id)`
        ];
    }
    downMySQL() {
        return [
            'DROP INDEX IF EXISTS idx_tasks_user_id ON tasks',
            'DROP TABLE IF EXISTS tasks'
        ];
    }
    downSQLite() {
        return [
            'DROP INDEX IF EXISTS idx_tasks_user_id',
            'DROP TABLE IF EXISTS tasks'
        ];
    }
}
exports.Migration010CreateTasksTables = Migration010CreateTasksTables;
//# sourceMappingURL=010_create_tasks_tables.js.map