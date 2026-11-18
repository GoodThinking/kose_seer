"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLDriver = void 0;
/**
 * MySQL 数据库驱动
 */
const promise_1 = require("mysql2/promise");
const utils_1 = require("../../shared/utils");
class MySQLDriver {
    _pool = null;
    _connection = null;
    _config;
    _connected = false;
    _inTransaction = false;
    constructor(config) {
        this._config = config;
    }
    /**
     * 连接数据库
     */
    async connect() {
        if (this._connected)
            return;
        try {
            this._pool = (0, promise_1.createPool)({
                host: this._config.host,
                port: this._config.port,
                user: this._config.user,
                password: this._config.password,
                database: this._config.database,
                connectionLimit: this._config.connectionLimit,
                waitForConnections: true,
                queueLimit: 0,
                charset: 'utf8mb4'
            });
            // 测试连接
            const conn = await this._pool.getConnection();
            conn.release();
            this._connected = true;
            utils_1.Logger.Info('[MySQLDriver] 数据库连接成功');
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[MySQLDriver] 数据库连接失败', error);
            throw err;
        }
    }
    /**
     * 断开连接
     */
    async disconnect() {
        if (!this._connected || !this._pool)
            return;
        try {
            if (this._connection) {
                this._connection.release();
                this._connection = null;
            }
            await this._pool.end();
            this._pool = null;
            this._connected = false;
            utils_1.Logger.Info('[MySQLDriver] 数据库连接已关闭');
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[MySQLDriver] 关闭连接失败', error);
            throw err;
        }
    }
    /**
     * 查询数据
     */
    async query(sql, params) {
        if (!this._pool) {
            throw new Error('数据库未连接');
        }
        try {
            const conn = this._inTransaction && this._connection ? this._connection : this._pool;
            const [rows] = await conn.query(sql, params);
            return rows;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[MySQLDriver] 查询失败: ${sql}`, error);
            throw err;
        }
    }
    /**
     * 执行SQL
     */
    async execute(sql, params) {
        if (!this._pool) {
            throw new Error('数据库未连接');
        }
        try {
            const conn = this._inTransaction && this._connection ? this._connection : this._pool;
            const [result] = await conn.execute(sql, params);
            return {
                affectedRows: result.affectedRows,
                insertId: result.insertId
            };
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[MySQLDriver] 执行失败: ${sql}`, error);
            throw err;
        }
    }
    /**
     * 开始事务
     */
    async beginTransaction() {
        if (!this._pool) {
            throw new Error('数据库未连接');
        }
        if (this._inTransaction) {
            throw new Error('已在事务中');
        }
        try {
            this._connection = await this._pool.getConnection();
            await this._connection.beginTransaction();
            this._inTransaction = true;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[MySQLDriver] 开始事务失败', error);
            throw err;
        }
    }
    /**
     * 提交事务
     */
    async commit() {
        if (!this._inTransaction || !this._connection) {
            throw new Error('未在事务中');
        }
        try {
            await this._connection.commit();
            this._connection.release();
            this._connection = null;
            this._inTransaction = false;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[MySQLDriver] 提交事务失败', error);
            throw err;
        }
    }
    /**
     * 回滚事务
     */
    async rollback() {
        if (!this._inTransaction || !this._connection) {
            throw new Error('未在事务中');
        }
        try {
            await this._connection.rollback();
            this._connection.release();
            this._connection = null;
            this._inTransaction = false;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[MySQLDriver] 回滚事务失败', error);
            throw err;
        }
    }
    /**
     * 是否已连接
     */
    isConnected() {
        return this._connected;
    }
}
exports.MySQLDriver = MySQLDriver;
//# sourceMappingURL=MySQLDriver.js.map