"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration009CreateFriendsTables = void 0;
class Migration009CreateFriendsTables {
    version = 9;
    name = 'create_friends_tables';
    upMySQL() {
        return [
            `CREATE TABLE IF NOT EXISTS friends (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        userId INT NOT NULL COMMENT '用户ID',
        friendId INT NOT NULL COMMENT '好友ID',
        status TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0=待确认, 1=已确认',
        createTime INT NOT NULL COMMENT '创建时间（Unix时间戳）',
        INDEX idx_user_friend (userId, friendId),
        INDEX idx_friend_user (friendId, userId),
        INDEX idx_userId (userId),
        INDEX idx_friendId (friendId),
        UNIQUE KEY uk_user_friend (userId, friendId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='好友关系表'`,
            `CREATE TABLE IF NOT EXISTS blacklist (
        id INT AUTO_INCREMENT PRIMARY KEY COMMENT '主键ID',
        userId INT NOT NULL COMMENT '用户ID',
        targetId INT NOT NULL COMMENT '被拉黑用户ID',
        createTime INT NOT NULL COMMENT '创建时间（Unix时间戳）',
        INDEX idx_user_target (userId, targetId),
        INDEX idx_userId (userId),
        UNIQUE KEY uk_user_target (userId, targetId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='黑名单表'`
        ];
    }
    upSQLite() {
        return [
            `CREATE TABLE IF NOT EXISTS friends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        friendId INTEGER NOT NULL,
        status INTEGER NOT NULL DEFAULT 0,
        createTime INTEGER NOT NULL,
        UNIQUE(userId, friendId)
      )`,
            `CREATE INDEX IF NOT EXISTS idx_friends_user_friend ON friends(userId, friendId)`,
            `CREATE INDEX IF NOT EXISTS idx_friends_friend_user ON friends(friendId, userId)`,
            `CREATE INDEX IF NOT EXISTS idx_friends_userId ON friends(userId)`,
            `CREATE INDEX IF NOT EXISTS idx_friends_friendId ON friends(friendId)`,
            `CREATE TABLE IF NOT EXISTS blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        targetId INTEGER NOT NULL,
        createTime INTEGER NOT NULL,
        UNIQUE(userId, targetId)
      )`,
            `CREATE INDEX IF NOT EXISTS idx_blacklist_user_target ON blacklist(userId, targetId)`,
            `CREATE INDEX IF NOT EXISTS idx_blacklist_userId ON blacklist(userId)`
        ];
    }
    downMySQL() {
        return [
            'DROP TABLE IF EXISTS blacklist',
            'DROP TABLE IF EXISTS friends'
        ];
    }
    downSQLite() {
        return [
            'DROP TABLE IF EXISTS blacklist',
            'DROP TABLE IF EXISTS friends'
        ];
    }
}
exports.Migration009CreateFriendsTables = Migration009CreateFriendsTables;
//# sourceMappingURL=009_create_friends_tables.js.map