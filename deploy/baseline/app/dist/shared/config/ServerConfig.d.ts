/**
 * 服务配置接口
 */
export interface IServerConfig {
    services: {
        game: {
            enabled: boolean;
            port: number;
            host: string;
        };
        regist: {
            enabled: boolean;
        };
        email: {
            enabled: boolean;
        };
        gm: {
            enabled: boolean;
            port: number;
            host: string;
            localMode?: boolean;
        };
        proxy: {
            enabled: boolean;
            listenPort: number;
            listenHost: string;
            webPort: number;
            loginServer: {
                host: string;
                port: number;
            };
            gameServer: {
                host: string;
                port: number;
            };
        };
    };
    database: {
        type: 'sqlite' | 'postgresql' | 'mysql';
        path?: string;
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        database?: string;
        options?: {
            verbose?: boolean;
            [key: string]: any;
        };
    };
    redis: {
        enabled: boolean;
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        directory: string;
        maxFiles: number;
    };
    security: {
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
    };
}
/**
 * 服务器配置管理器
 */
export declare class ServerConfig {
    private static _instance;
    private _config;
    private constructor();
    static get Instance(): ServerConfig;
    /**
     * 加载配置文件
     */
    private LoadConfig;
    /**
     * 获取默认配置
     */
    private GetDefaultConfig;
    /**
     * 获取完整配置
     */
    get Config(): IServerConfig;
    /**
     * 获取RegistServer配置
     */
    get Regist(): {
        enabled: boolean;
    };
    /**
     * 获取GameServer配置
     */
    get Game(): {
        enabled: boolean;
        port: number;
        host: string;
    };
    /**
     * 获取EmailServer配置
     */
    get Email(): {
        enabled: boolean;
    };
    /**
     * 获取GMServer配置
     */
    get GM(): {
        enabled: boolean;
        port: number;
        host: string;
        localMode?: boolean;
    };
    /**
     * 获取ProxyServer配置
     */
    get Proxy(): {
        enabled: boolean;
        listenPort: number;
        listenHost: string;
        webPort: number;
        loginServer: {
            host: string;
            port: number;
        };
        gameServer: {
            host: string;
            port: number;
        };
    };
    /**
     * 获取数据库配置
     */
    get Database(): {
        type: "sqlite" | "postgresql" | "mysql";
        path?: string;
        host?: string;
        port?: number;
        username?: string;
        password?: string;
        database?: string;
        options?: {
            verbose?: boolean;
            [key: string]: any;
        };
    };
    /**
     * 获取Redis配置
     */
    get Redis(): {
        enabled: boolean;
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    /**
     * 获取日志配置
     */
    get Logging(): {
        level: "debug" | "info" | "warn" | "error";
        directory: string;
        maxFiles: number;
    };
    /**
     * 获取安全配置
     */
    get Security(): {
        sessionTimeout: number;
        maxLoginAttempts: number;
        lockoutDuration: number;
    };
    /**
     * 重新加载配置
     */
    Reload(): void;
}
export declare const Config: ServerConfig;
//# sourceMappingURL=ServerConfig.d.ts.map