import { IDriver, IExecuteResult } from './IDriver';
import { IMySQLConfig } from '../DatabaseConfig';
export declare class MySQLDriver implements IDriver {
    private _pool;
    private _connection;
    private _config;
    private _connected;
    private _inTransaction;
    constructor(config: IMySQLConfig);
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
}
//# sourceMappingURL=MySQLDriver.d.ts.map