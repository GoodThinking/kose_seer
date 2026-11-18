"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration014AddMessWinAndCurTitle = void 0;
class Migration014AddMessWinAndCurTitle {
    version = 14;
    name = 'add_mess_win_and_cur_title';
    upMySQL() {
        return [
            // 使用 IF NOT EXISTS 避免重复添加
            `ALTER TABLE players ADD COLUMN IF NOT EXISTS mess_win INT NOT NULL DEFAULT 0 COMMENT '混战胜利次数' AFTER mon_king_win`
            // cur_title 已在 migration 003 中创建，不需要再添加
        ];
    }
    upSQLite() {
        // SQLite 不支持 ADD COLUMN IF NOT EXISTS，但支持 ADD COLUMN
        // 如果字段已存在会报错，但不影响数据库
        return [
            `ALTER TABLE players ADD COLUMN mess_win INTEGER NOT NULL DEFAULT 0`
        ];
    }
    downMySQL() {
        return [
            'ALTER TABLE players DROP COLUMN IF EXISTS mess_win'
            // 不删除 cur_title，因为它是 migration 003 创建的
        ];
    }
    downSQLite() {
        // SQLite 不支持 DROP COLUMN IF EXISTS
        // 返回空数组，不执行任何操作
        return [];
    }
}
exports.Migration014AddMessWinAndCurTitle = Migration014AddMessWinAndCurTitle;
//# sourceMappingURL=014_add_mess_win_and_cur_title.js.map