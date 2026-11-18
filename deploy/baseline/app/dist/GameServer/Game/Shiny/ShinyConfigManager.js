"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShinyConfigManager = void 0;
const ConfigRegistry_1 = require("../../../shared/config/ConfigRegistry");
const ConfigDefinitions_1 = require("../../../shared/config/ConfigDefinitions");
const Logger_1 = require("../../../shared/utils/Logger");
/**
 * 异色配置管理器
 * 负责加载、缓存和提供异色配置
 */
class ShinyConfigManager {
    static _instance;
    _configs = new Map();
    _version = 0;
    _loaded = false;
    static get Instance() {
        if (!ShinyConfigManager._instance) {
            ShinyConfigManager._instance = new ShinyConfigManager();
        }
        return ShinyConfigManager._instance;
    }
    /**
     * 加载异色配置
     */
    async Load() {
        if (this._loaded) {
            Logger_1.Logger.Debug('[ShinyConfigManager] 配置已加载，跳过');
            return;
        }
        try {
            const configFile = ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.SHINY_CONFIGS);
            if (!configFile) {
                Logger_1.Logger.Warn('[ShinyConfigManager] 异色配置文件未找到');
                return;
            }
            this._configs.clear();
            for (const config of configFile.configs) {
                if (config.enabled) {
                    this._configs.set(config.shinyId, config);
                }
            }
            // 使用配置文件的 version 字段，如果没有则使用秒级时间戳
            this._version = configFile.version || Math.floor(Date.now() / 1000);
            this._loaded = true;
            Logger_1.Logger.Info(`[ShinyConfigManager] 加载了 ${this._configs.size} 个异色配置, version=${this._version}`);
        }
        catch (error) {
            Logger_1.Logger.Error('[ShinyConfigManager] 加载异色配置失败', error);
        }
    }
    /**
     * 获取所有异色配置
     */
    GetAllConfigs() {
        return Array.from(this._configs.values());
    }
    /**
     * 获取配置版本号
     */
    GetVersion() {
        return this._version;
    }
    /**
     * 获取配置 JSON 字符串（用于发送给客户端）
     */
    GetConfigJson() {
        const exportData = {
            version: this._version,
            configs: Array.from(this._configs.values())
        };
        return JSON.stringify(exportData);
    }
    /**
     * 获取指定异色配置
     */
    GetConfig(shinyId) {
        return this._configs.get(shinyId);
    }
    /**
     * 配置是否已加载
     */
    IsLoaded() {
        return this._loaded;
    }
    /**
     * 热重载配置
     */
    async Reload() {
        this._loaded = false; // 重置加载状态
        await ConfigRegistry_1.ConfigRegistry.Instance.Reload(ConfigDefinitions_1.ConfigKeys.SHINY_CONFIGS);
        await this.Load();
        Logger_1.Logger.Info('[ShinyConfigManager] 配置已热重载');
    }
    /**
     * 获取统计信息
     */
    GetStats() {
        return {
            total: this._configs.size,
            version: this._version
        };
    }
}
exports.ShinyConfigManager = ShinyConfigManager;
//# sourceMappingURL=ShinyConfigManager.js.map