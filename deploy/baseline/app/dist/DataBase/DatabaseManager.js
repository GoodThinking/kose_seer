"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const MySQLDriver_1 = require("./drivers/MySQLDriver");
const SQLiteDriver_1 = require("./drivers/SQLiteDriver");
const config_1 = require("../shared/config");
const utils_1 = require("../shared/utils");
class DatabaseManager {
    static _instance = null;
    _driver = null;
    operationTail = Promise.resolve();
    closing = false;
    shutdownPromise = null;
    /** Serializes access to the driver, whose transaction connection is shared.
     * Callbacks must use the supplied driver, not re-enter this manager. */
    async WithConnection(callback) {
        if (this.closing)
            throw new Error('数据库正在关闭');
        return this.Enqueue(callback);
    }
    async Enqueue(callback) {
        const previous = this.operationTail;
        let release;
        this.operationTail = new Promise(resolve => { release = resolve; });
        await previous;
        try {
            return await callback(this.Driver);
        }
        finally {
            release();
        }
    }
    constructor() {
        // 使用统一配置
    }
    /**
     * 获取单例实例
     */
    static get Instance() {
        if (!DatabaseManager._instance) {
            DatabaseManager._instance = new DatabaseManager();
        }
        return DatabaseManager._instance;
    }
    /**
     * 初始化数据库连接
     */
    async Initialize() {
        if (this.shutdownPromise)
            await this.shutdownPromise;
        if (this._driver?.isConnected()) {
            utils_1.Logger.Warn('[DatabaseManager] 数据库已连接');
            return;
        }
        const dbConfig = config_1.Config.Database;
        utils_1.Logger.Info(`[DatabaseManager] 使用 ${dbConfig.type} 数据库`);
        // 根据配置创建驱动
        if (dbConfig.type === 'mysql') {
            if (!dbConfig.host || !dbConfig.database) {
                throw new Error('MySQL 配置缺失');
            }
            this._driver = new MySQLDriver_1.MySQLDriver({
                host: dbConfig.host,
                port: dbConfig.port || 3306,
                user: dbConfig.username || 'root',
                password: dbConfig.password || '',
                database: dbConfig.database,
                connectionLimit: 10,
            });
        }
        else if (dbConfig.type === 'sqlite') {
            if (!dbConfig.path) {
                throw new Error('SQLite 配置缺失');
            }
            this._driver = new SQLiteDriver_1.SQLiteDriver({
                filename: dbConfig.path,
            });
        }
        else {
            throw new Error(`不支持的数据库类型: ${dbConfig.type}`);
        }
        await this._driver.connect();
        this.closing = false;
        this.shutdownPromise = null;
        utils_1.Logger.Info('[DatabaseManager] 数据库连接成功');
    }
    /**
     * 关闭数据库连接
     */
    async Shutdown() {
        if (this.shutdownPromise)
            return this.shutdownPromise;
        if (!this._driver)
            return;
        this.closing = true;
        this.shutdownPromise = this.Enqueue(async (driver) => {
            await driver.disconnect();
            this._driver = null;
        });
        return this.shutdownPromise;
    }
    /**
     * 获取数据库驱动
     */
    get Driver() {
        if (!this._driver) {
            throw new Error('数据库未初始化');
        }
        return this._driver;
    }
    /**
     * 获取数据库类型
     */
    get DatabaseType() {
        return config_1.Config.Database.type;
    }
    /**
     * 查询数据
     */
    async Query(sql, params) {
        return this.WithConnection(driver => driver.query(sql, params));
    }
    /**
     * 执行SQL
     */
    async Execute(sql, params) {
        return this.WithConnection(driver => driver.execute(sql, params));
    }
    /**
     * 执行事务
     * @param callback 事务回调函数
     */
    async Transaction(callback) {
        return this.WithConnection(async (driver) => {
            await driver.beginTransaction();
            try {
                const result = await callback(driver);
                await driver.commit();
                return result;
            }
            catch (err) {
                await driver.rollback();
                throw err;
            }
        });
    }
}
exports.DatabaseManager = DatabaseManager;
//# sourceMappingURL=DatabaseManager.js.map