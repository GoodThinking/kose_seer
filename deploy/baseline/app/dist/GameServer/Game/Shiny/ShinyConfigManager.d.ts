import { IShinyConfigItem } from '../../../shared/config/game/interfaces/IShinyConfig';
/**
 * 异色配置管理器
 * 负责加载、缓存和提供异色配置
 */
export declare class ShinyConfigManager {
    private static _instance;
    private _configs;
    private _version;
    private _loaded;
    static get Instance(): ShinyConfigManager;
    /**
     * 加载异色配置
     */
    Load(): Promise<void>;
    /**
     * 获取所有异色配置
     */
    GetAllConfigs(): IShinyConfigItem[];
    /**
     * 获取配置版本号
     */
    GetVersion(): number;
    /**
     * 获取配置 JSON 字符串（用于发送给客户端）
     */
    GetConfigJson(): string;
    /**
     * 获取指定异色配置
     */
    GetConfig(shinyId: number): IShinyConfigItem | undefined;
    /**
     * 配置是否已加载
     */
    IsLoaded(): boolean;
    /**
     * 热重载配置
     */
    Reload(): Promise<void>;
    /**
     * 获取统计信息
     */
    GetStats(): {
        total: number;
        version: number;
    };
}
//# sourceMappingURL=ShinyConfigManager.d.ts.map