import { ConfigType } from './ConfigDefinitions';
/**
 * 配置注册表
 * 管理所有游戏配置的注册和加载
 */
export declare class ConfigRegistry {
    private static _instance;
    private _configs;
    private _configPaths;
    private _configTypes;
    private _initialized;
    private constructor();
    static get Instance(): ConfigRegistry;
    /**
     * 注册配置
     * @param key 配置键名
     * @param path 配置文件路径（相对于config目录）
     * @param type 配置类型（JSON或XML）
     */
    Register(key: string, path: string, type?: ConfigType): void;
    /**
     * 批量注册配置
     */
    RegisterBatch(configs: Array<{
        key: string;
        path: string;
        type?: ConfigType;
    }>): void;
    /**
     * 初始化所有配置（在服务启动时调用）
     */
    Initialize(): Promise<void>;
    /**
     * 获取配置
     * @param key 配置键名
     * @returns 配置对象
     */
    Get<T = any>(key: string): T | null;
    /**
     * 重新加载指定配置
     * @param key 配置键名
     */
    Reload(key: string): Promise<boolean>;
    /**
     * 重新加载所有配置
     */
    ReloadAll(): Promise<void>;
    /**
     * 检查配置是否已加载
     */
    IsLoaded(key: string): boolean;
    /**
     * 获取所有已注册的配置键名
     */
    GetRegisteredKeys(): string[];
    /**
     * 获取配置统计信息
     */
    GetStats(): {
        registered: number;
        loaded: number;
        initialized: boolean;
    };
    /**
     * 重载指定配置（别名方法，用于GM Server）
     */
    ReloadConfig(key: string): Promise<boolean>;
    /**
     * 获取所有配置（用于GM Server）
     */
    GetAllConfigs(): Record<string, any>;
    /**
     * 获取配置注册状态
     * @returns GameServer配置注册状态
     */
    GetIsInit(): boolean;
}
//# sourceMappingURL=ConfigRegistry.d.ts.map