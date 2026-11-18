/**
 * SQLite 数据库驱动
 */
import { IDriver, IExecuteResult } from './IDriver';
import { ISQLiteConfig } from '../DatabaseConfig';
type DatabaseType = import('better-sqlite3').Database;
export declare class SQLiteDriver implements IDriver {
    private _db;
    private _config;
    private _connected;
    private _inTransaction;
    constructor(config: ISQLiteConfig);
    /**
     * 连接数据库
     */
    connect(): Promise<void>;
    /**
     * 断开连接
     */
    disconnect(): Promise<void>;
    /**
     * 查询数据
     */
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    /**
     * 执行SQL
     */
    execute(sql: string, params?: any[]): Promise<IExecuteResult>;
    /**
     * 开始事务
     */
    beginTransaction(): Promise<void>;
    /**
     * 提交事务
     */
    commit(): Promise<void>;
    /**
     * 回滚事务
     */
    rollback(): Promise<void>;
    /**
     * 是否已连接
     */
    isConnected(): boolean;
    /**
     * 获取原始数据库实例（用于高级操作）
     */
    getRawDatabase(): DatabaseType | null;
}
export {};
//# sourceMappingURL=SQLiteDriver.d.ts.map