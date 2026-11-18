/**
 * 配置加载器
 * 负责加载和管理游戏配置文件
 */
export declare class ConfigLoader {
    private static _instance;
    private _configCache;
    private _configDir;
    private constructor();
    static get Instance(): ConfigLoader;
    /**
     * 静态方法：加载配置文件（兼容旧API）
     * @param filename 配置文件名
     * @param defaultConfig 默认配置
     * @returns 配置对象
     */
    static Load<T>(filename: string, defaultConfig: T): T;
    /**
     * 加载配置文件并提供默认值
     * @param filename 配置文件名（相对于config目录）
     * @param defaultConfig 默认配置
     * @returns 配置对象
     */
    LoadWithDefault<T>(filename: string, defaultConfig: T): T;
    /**
     * 加载JSON配置文件
     * @param relativePath 相对于config目录的路径，如 'data/json/map-ogres.json'
     * @returns 配置对象
     */
    LoadJson<T = any>(relativePath: string): T | null;
    /**
     * 重新加载配置（清除缓存）
     * @param relativePath 相对路径，如果不指定则清除所有缓存
     */
    Reload(relativePath?: string): void;
    /**
     * 获取配置目录路径
     */
    GetConfigDir(): string;
    /**
     * 检查配置文件是否存在
     */
    Exists(relativePath: string): boolean;
    /**
     * 加载XML配置文件
     * @param relativePath 相对于config目录的路径，如 'data/pets.xml'
     * @returns 配置对象
     */
    LoadXml<T = any>(relativePath: string): Promise<T | null>;
    /**
     * 同步加载XML配置文件（用于启动时加载）
     * @param relativePath 相对于config目录的路径
     * @returns 配置对象
     */
    LoadXmlSync<T = any>(relativePath: string): T | null;
}
//# sourceMappingURL=ConfigLoader.d.ts.map