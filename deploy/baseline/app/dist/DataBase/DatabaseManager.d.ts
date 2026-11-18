/**
 * 数据库管理器
 * 统一管理数据库连接和操作
 */
import { IDriver } from './drivers/IDriver';
export declare class DatabaseManager {
    private static _instance;
    private _driver;
    private constructor();
    /**
     * 获取单例实例
     */
    static get Instance(): DatabaseManager;
    /**
     * 初始化数据库连接
     */
    Initialize(): Promise<void>;
    /**
     * 关闭数据库连接
     */
    Shutdown(): Promise<void>;
    /**
     * 获取数据库驱动
     */
    get Driver(): IDriver;
    /**
     * 获取数据库类型
     */
    get DatabaseType(): 'mysql' | 'sqlite' | 'postgresql';
    /**
     * 查询数据
     */
    Query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    /**
     * 执行SQL
     */
    Execute(sql: string, params?: any[]): Promise<{
        affectedRows: number;
        insertId: number;
    }>;
    /**
     * 执行事务
     * @param callback 事务回调函数
     */
    Transaction<T>(callback: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=DatabaseManager.d.ts.map