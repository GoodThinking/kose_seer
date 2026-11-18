"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const xml2js = __importStar(require("xml2js"));
const utils_1 = require("../utils");
/**
 * 配置加载器
 * 负责加载和管理游戏配置文件
 */
class ConfigLoader {
    static _instance;
    _configCache = new Map();
    _configDir;
    constructor() {
        // 配置文件目录：
        // - 开发环境：项目根目录/config
        // - pkg 打包：可执行文件目录/config
        const baseDir = process.pkg
            ? path.dirname(process.execPath)
            : process.cwd();
        this._configDir = path.join(baseDir, 'config');
        utils_1.Logger.Info(`[ConfigLoader] 配置目录: ${this._configDir}`);
    }
    static get Instance() {
        if (!ConfigLoader._instance) {
            ConfigLoader._instance = new ConfigLoader();
        }
        return ConfigLoader._instance;
    }
    /**
     * 静态方法：加载配置文件（兼容旧API）
     * @param filename 配置文件名
     * @param defaultConfig 默认配置
     * @returns 配置对象
     */
    static Load(filename, defaultConfig) {
        return ConfigLoader.Instance.LoadWithDefault(filename, defaultConfig);
    }
    /**
     * 加载配置文件并提供默认值
     * @param filename 配置文件名（相对于config目录）
     * @param defaultConfig 默认配置
     * @returns 配置对象
     */
    LoadWithDefault(filename, defaultConfig) {
        const config = this.LoadJson(filename);
        return config || defaultConfig;
    }
    /**
     * 加载JSON配置文件
     * @param relativePath 相对于config目录的路径，如 'data/json/map-ogres.json'
     * @returns 配置对象
     */
    LoadJson(relativePath) {
        // 检查缓存
        if (this._configCache.has(relativePath)) {
            return this._configCache.get(relativePath);
        }
        const fullPath = path.join(this._configDir, relativePath);
        try {
            if (!fs.existsSync(fullPath)) {
                utils_1.Logger.Warn(`[ConfigLoader] 配置文件不存在: ${fullPath}`);
                return null;
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            const config = JSON.parse(content);
            // 缓存配置
            this._configCache.set(relativePath, config);
            utils_1.Logger.Info(`[ConfigLoader] 准备加载配置: ${relativePath}`);
            return config;
        }
        catch (error) {
            utils_1.Logger.Error(`[ConfigLoader] 加载配置失败: ${relativePath}`, error);
            return null;
        }
    }
    /**
     * 重新加载配置（清除缓存）
     * @param relativePath 相对路径，如果不指定则清除所有缓存
     */
    Reload(relativePath) {
        if (relativePath) {
            this._configCache.delete(relativePath);
            utils_1.Logger.Info(`[ConfigLoader] 重新加载配置: ${relativePath}`);
        }
        else {
            this._configCache.clear();
            utils_1.Logger.Info(`[ConfigLoader] 清除所有配置缓存`);
        }
    }
    /**
     * 获取配置目录路径
     */
    GetConfigDir() {
        return this._configDir;
    }
    /**
     * 检查配置文件是否存在
     */
    Exists(relativePath) {
        const fullPath = path.join(this._configDir, relativePath);
        return fs.existsSync(fullPath);
    }
    /**
     * 加载XML配置文件
     * @param relativePath 相对于config目录的路径，如 'data/pets.xml'
     * @returns 配置对象
     */
    async LoadXml(relativePath) {
        // 检查缓存
        if (this._configCache.has(relativePath)) {
            return this._configCache.get(relativePath);
        }
        const fullPath = path.join(this._configDir, relativePath);
        try {
            if (!fs.existsSync(fullPath)) {
                utils_1.Logger.Warn(`[ConfigLoader] XML配置文件不存在: ${fullPath}`);
                return null;
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parser = new xml2js.Parser({
                explicitArray: false,
                mergeAttrs: true,
                attrValueProcessors: [
                    (value) => {
                        // 尝试转换数字
                        const num = Number(value);
                        if (!isNaN(num)) {
                            return num;
                        }
                        return value;
                    }
                ]
            });
            const result = await parser.parseStringPromise(content);
            const config = result;
            // 缓存配置
            this._configCache.set(relativePath, config);
            utils_1.Logger.Info(`[ConfigLoader] 加载XML配置: ${relativePath}`);
            return config;
        }
        catch (error) {
            utils_1.Logger.Error(`[ConfigLoader] 加载XML配置失败: ${relativePath}`, error);
            return null;
        }
    }
    /**
     * 同步加载XML配置文件（用于启动时加载）
     * @param relativePath 相对于config目录的路径
     * @returns 配置对象
     */
    LoadXmlSync(relativePath) {
        // 检查缓存
        if (this._configCache.has(relativePath)) {
            return this._configCache.get(relativePath);
        }
        const fullPath = path.join(this._configDir, relativePath);
        try {
            if (!fs.existsSync(fullPath)) {
                utils_1.Logger.Warn(`[ConfigLoader] XML配置文件不存在: ${fullPath}`);
                return null;
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            const parser = new xml2js.Parser({
                explicitArray: false,
                mergeAttrs: true,
                attrValueProcessors: [
                    (value) => {
                        // 尝试转换数字
                        const num = Number(value);
                        if (!isNaN(num)) {
                            return num;
                        }
                        return value;
                    }
                ]
            });
            let config = null;
            parser.parseString(content, (err, result) => {
                if (err) {
                    throw err;
                }
                config = result;
            });
            if (config) {
                // 缓存配置
                this._configCache.set(relativePath, config);
                utils_1.Logger.Info(`[ConfigLoader] 加载XML配置: ${relativePath}`);
            }
            return config;
        }
        catch (error) {
            utils_1.Logger.Error(`[ConfigLoader] 加载XML配置失败: ${relativePath}`, error);
            return null;
        }
    }
}
exports.ConfigLoader = ConfigLoader;
//# sourceMappingURL=ConfigLoader.js.map