"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigRegistry = void 0;
const utils_1 = require("../utils");
const ConfigLoader_1 = require("./ConfigLoader");
const ConfigDefinitions_1 = require("./ConfigDefinitions");
/**
 * 配置注册表
 * 管理所有游戏配置的注册和加载
 */
class ConfigRegistry {
    static _instance;
    _configs = new Map();
    _configPaths = new Map();
    _configTypes = new Map();
    _initialized = false;
    constructor() { }
    static get Instance() {
        if (!ConfigRegistry._instance) {
            ConfigRegistry._instance = new ConfigRegistry();
        }
        return ConfigRegistry._instance;
    }
    /**
     * 注册配置
     * @param key 配置键名
     * @param path 配置文件路径（相对于config目录）
     * @param type 配置类型（JSON或XML）
     */
    Register(key, path, type = ConfigDefinitions_1.ConfigType.JSON) {
        this._configPaths.set(key, path);
        this._configTypes.set(key, type);
        utils_1.Logger.Info(`[ConfigRegistry] 注册配置: ${key} -> ${path} (${type})`);
    }
    /**
     * 批量注册配置
     */
    RegisterBatch(configs) {
        for (const config of configs) {
            this.Register(config.key, config.path, config.type || ConfigDefinitions_1.ConfigType.JSON);
        }
    }
    /**
     * 初始化所有配置（在服务启动时调用）
     */
    async Initialize() {
        if (this._initialized) {
            utils_1.Logger.Warn('[ConfigRegistry] 配置已初始化，跳过');
            return;
        }
        utils_1.Logger.Info('[ConfigRegistry] 开始加载所有配置...');
        const startTime = Date.now();
        let successCount = 0;
        let failCount = 0;
        for (const [key, path] of this._configPaths.entries()) {
            try {
                const type = this._configTypes.get(key) || ConfigDefinitions_1.ConfigType.JSON;
                let config = null;
                if (type === ConfigDefinitions_1.ConfigType.XML) {
                    config = ConfigLoader_1.ConfigLoader.Instance.LoadXmlSync(path);
                }
                else {
                    config = ConfigLoader_1.ConfigLoader.Instance.LoadJson(path);
                }
                if (config) {
                    this._configs.set(key, config);
                    successCount++;
                    utils_1.Logger.Info(`[ConfigRegistry] ✓ ${key}`);
                }
                else {
                    failCount++;
                    utils_1.Logger.Warn(`[ConfigRegistry] ✗ ${key} (文件不存在或格式错误)`);
                }
            }
            catch (error) {
                failCount++;
                utils_1.Logger.Error(`[ConfigRegistry] ✗ ${key} 加载失败`, error);
            }
        }
        const elapsed = Date.now() - startTime;
        this._initialized = true;
        utils_1.Logger.Info(`[ConfigRegistry] 配置加载完成: 成功=${successCount}, 失败=${failCount}, 耗时=${elapsed}ms`);
    }
    /**
     * 获取配置
     * @param key 配置键名
     * @returns 配置对象
     */
    Get(key) {
        if (!this._initialized) {
            utils_1.Logger.Warn(`[ConfigRegistry] 配置未初始化，尝试获取: ${key}`);
        }
        const config = this._configs.get(key);
        if (!config) {
            utils_1.Logger.Warn(`[ConfigRegistry] 配置不存在: ${key}`);
            return null;
        }
        return config;
    }
    /**
     * 重新加载指定配置
     * @param key 配置键名
     */
    async Reload(key) {
        const path = this._configPaths.get(key);
        if (!path) {
            utils_1.Logger.Error(`[ConfigRegistry] 配置未注册: ${key}`);
            return false;
        }
        try {
            utils_1.Logger.Info(`[ConfigRegistry] 开始重新加载配置: ${key} (路径: ${path})`);
            // 清除ConfigLoader缓存
            ConfigLoader_1.ConfigLoader.Instance.Reload(path);
            // 重新加载
            const type = this._configTypes.get(key) || ConfigDefinitions_1.ConfigType.JSON;
            let config = null;
            if (type === ConfigDefinitions_1.ConfigType.XML) {
                config = await ConfigLoader_1.ConfigLoader.Instance.LoadXml(path);
            }
            else {
                config = ConfigLoader_1.ConfigLoader.Instance.LoadJson(path);
            }
            if (config) {
                this._configs.set(key, config);
                utils_1.Logger.Info(`[ConfigRegistry] ✓ 重新加载配置成功: ${key} (类型: ${type})`);
                return true;
            }
            else {
                utils_1.Logger.Error(`[ConfigRegistry] ✗ 重新加载配置失败: ${key} (配置为空)`);
                return false;
            }
        }
        catch (error) {
            utils_1.Logger.Error(`[ConfigRegistry] ✗ 重新加载配置异常: ${key}`, error);
            return false;
        }
    }
    /**
     * 重新加载所有配置
     */
    async ReloadAll() {
        utils_1.Logger.Info('[ConfigRegistry] 重新加载所有配置...');
        this._configs.clear();
        this._initialized = false;
        ConfigLoader_1.ConfigLoader.Instance.Reload();
        await this.Initialize();
    }
    /**
     * 检查配置是否已加载
     */
    IsLoaded(key) {
        return this._configs.has(key);
    }
    /**
     * 获取所有已注册的配置键名
     */
    GetRegisteredKeys() {
        return Array.from(this._configPaths.keys());
    }
    /**
     * 获取配置统计信息
     */
    GetStats() {
        return {
            registered: this._configPaths.size,
            loaded: this._configs.size,
            initialized: this._initialized,
        };
    }
    /**
     * 重载指定配置（别名方法，用于GM Server）
     */
    async ReloadConfig(key) {
        return await this.Reload(key);
    }
    /**
     * 获取所有配置（用于GM Server）
     */
    GetAllConfigs() {
        const result = {};
        for (const [key, value] of this._configs.entries()) {
            result[key] = value;
        }
        return result;
    }
    /**
     * 获取配置注册状态
     * @returns GameServer配置注册状态
     */
    GetIsInit() {
        return this._initialized;
    }
}
exports.ConfigRegistry = ConfigRegistry;
//# sourceMappingURL=ConfigRegistry.js.map