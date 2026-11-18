"use strict";
/**
 * 数据库配置接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultDatabaseConfig = void 0;
/**
 * 默认数据库配置
 */
exports.DefaultDatabaseConfig = {
    type: 'sqlite',
    mysql: {
        host: '127.0.0.1',
        port: 3306,
        user: 'seer',
        password: 'seer123',
        database: 'seer_db',
        connectionLimit: 10
    },
    sqlite: {
        filename: './data/seer.db'
    }
};
//# sourceMappingURL=DatabaseConfig.js.map