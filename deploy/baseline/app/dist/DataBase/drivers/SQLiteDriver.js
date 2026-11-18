"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLiteDriver = void 0;
const utils_1 = require("../../shared/utils");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// 动态加载 better-sqlite3，支持 pkg 打包
function loadBetterSqlite3() {
    const isPkg = process.pkg !== undefined;
    if (isPkg) {
        // pkg 打包环境：从 exe 同级目录加载
        const exeDir = path.dirname(process.execPath);
        // 尝试多个可能的路径
        const possiblePaths = [
            path.join(exeDir, 'build', 'Release', 'better_sqlite3.node'),
            path.join(exeDir, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
            path.join(exeDir, 'node_modules', 'better-sqlite3', 'prebuilds', 'win32-x64', 'better_sqlite3.node'),
            path.join(exeDir, 'better_sqlite3.node'),
        ];
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                utils_1.Logger.Info(`[SQLiteDriver] 使用原生模块: ${p}`);
                // 返回 Database 类和 nativeBinding 路径
                return {
                    Database: require('better-sqlite3'),
                    nativeBinding: p
                };
            }
        }
        utils_1.Logger.Warn('[SQLiteDriver] 未找到原生模块，尝试默认加载');
    }
    return { Database: require('better-sqlite3') };
}
class SQLiteDriver {
    _db = null;
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
            // 确保目录存在
            const dir = path.dirname(this._config.filename);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            // 动态加载 better-sqlite3
            const { Database, nativeBinding } = loadBetterSqlite3();
            // 创建数据库连接，如果有 nativeBinding 则使用它
            const options = nativeBinding ? { nativeBinding } : {};
            const db = new Database(this._config.filename, options);
            // 启用外键约束
            db.pragma('foreign_keys = ON');
            // 使用 WAL 模式提高并发性能
            db.pragma('journal_mode = WAL');
            this._db = db;
            this._connected = true;
            utils_1.Logger.Info(`[SQLiteDriver] 数据库连接成功: ${this._config.filename}`);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[SQLiteDriver] 数据库连接失败', error);
            throw err;
        }
    }
    /**
     * 断开连接
     */
    async disconnect() {
        if (!this._connected || !this._db)
            return;
        try {
            this._db.close();
            this._db = null;
            this._connected = false;
            utils_1.Logger.Info('[SQLiteDriver] 数据库连接已关闭');
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[SQLiteDriver] 关闭连接失败', error);
            throw err;
        }
    }
    /**
     * 查询数据
     */
    async query(sql, params) {
        if (!this._db) {
            throw new Error('数据库未连接');
        }
        try {
            const stmt = this._db.prepare(sql);
            const rows = params ? stmt.all(...params) : stmt.all();
            return rows;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[SQLiteDriver] 查询失败: ${sql}`, error);
            throw err;
        }
    }
    /**
     * 执行SQL
     */
    async execute(sql, params) {
        if (!this._db) {
            throw new Error('数据库未连接');
        }
        try {
            const stmt = this._db.prepare(sql);
            const result = params ? stmt.run(...params) : stmt.run();
            return {
                affectedRows: result.changes,
                insertId: Number(result.lastInsertRowid)
            };
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[SQLiteDriver] 执行失败: ${sql}`, error);
            utils_1.Logger.Error(`[SQLiteDriver] 错误详情: ${error.message}`);
            throw err;
        }
    }
    /**
     * 开始事务
     */
    async beginTransaction() {
        if (!this._db) {
            throw new Error('数据库未连接');
        }
        if (this._inTransaction) {
            throw new Error('已在事务中');
        }
        try {
            this._db.exec('BEGIN TRANSACTION');
            this._inTransaction = true;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[SQLiteDriver] 开始事务失败', error);
            throw err;
        }
    }
    /**
     * 提交事务
     */
    async commit() {
        if (!this._db || !this._inTransaction) {
            throw new Error('未在事务中');
        }
        try {
            this._db.exec('COMMIT');
            this._inTransaction = false;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[SQLiteDriver] 提交事务失败', error);
            throw err;
        }
    }
    /**
     * 回滚事务
     */
    async rollback() {
        if (!this._db || !this._inTransaction) {
            throw new Error('未在事务中');
        }
        try {
            this._db.exec('ROLLBACK');
            this._inTransaction = false;
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[SQLiteDriver] 回滚事务失败', error);
            throw err;
        }
    }
    /**
     * 是否已连接
     */
    isConnected() {
        return this._connected;
    }
    /**
     * 获取原始数据库实例（用于高级操作）
     */
    getRawDatabase() {
        return this._db;
    }
}
exports.SQLiteDriver = SQLiteDriver;
//# sourceMappingURL=SQLiteDriver.js.map