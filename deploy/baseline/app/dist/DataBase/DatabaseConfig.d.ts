/**
 * 数据库配置接口
 */
/**
 * MySQL 配置
 */
export interface IMySQLConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    connectionLimit: number;
}
/**
 * SQLite 配置
 */
export interface ISQLiteConfig {
    filename: string;
}
/**
 * 数据库配置
 */
export interface IDatabaseConfig {
    type: 'mysql' | 'sqlite';
    mysql?: IMySQLConfig;
    sqlite?: ISQLiteConfig;
}
/**
 * 默认数据库配置
 */
export declare const DefaultDatabaseConfig: IDatabaseConfig;
//# sourceMappingURL=DatabaseConfig.d.ts.map