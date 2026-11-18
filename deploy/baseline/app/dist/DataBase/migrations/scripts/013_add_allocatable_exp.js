"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration013AddAllocatableExp = void 0;
class Migration013AddAllocatableExp {
    version = 13;
    name = 'add_allocatable_exp';
    upMySQL() {
        return [
            `ALTER TABLE players ADD COLUMN allocatable_exp INT NOT NULL DEFAULT 0 COMMENT '可分配经验值' AFTER fight_badge`
        ];
    }
    upSQLite() {
        return [
            `ALTER TABLE players ADD COLUMN allocatable_exp INTEGER NOT NULL DEFAULT 0`
        ];
    }
    downMySQL() {
        return [
            'ALTER TABLE players DROP COLUMN allocatable_exp'
        ];
    }
    downSQLite() {
        // SQLite doesn't support DROP COLUMN directly, need to recreate table
        return [
            'ALTER TABLE players DROP COLUMN allocatable_exp'
        ];
    }
}
exports.Migration013AddAllocatableExp = Migration013AddAllocatableExp;
//# sourceMappingURL=013_add_allocatable_exp.js.map