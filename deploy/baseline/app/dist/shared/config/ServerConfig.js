"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = exports.ServerConfig = void 0;
const ClientProtocol_1 = require("../protocol/ClientProtocol");
const utils_1 = require("../utils");
const ConfigLoader_1 = require("./ConfigLoader");
const ConfigDefinitions_1 = require("./ConfigDefinitions");
/**
 * 服务器配置管理器
 */
class ServerConfig {
    static _instance;
    _config;
    constructor() {
        this._config = this.LoadConfig();
    }
    static get Instance() {
        if (!ServerConfig._instance) {
            ServerConfig._instance = new ServerConfig();
        }
        return ServerConfig._instance;
    }
    /**
     * 加载配置文件
     */
    LoadConfig() {
        const configPath = ConfigDefinitions_1.ConfigPaths[ConfigDefinitions_1.ConfigKeys.SERVER_CONFIG];
        utils_1.Logger.Info(`[ServerConfig] 准备加载配置: ${configPath}`);
        const config = ConfigLoader_1.ConfigLoader.Instance.LoadJson(configPath);
        if (!config) {
            utils_1.Logger.Warn('[ServerConfig] 配置文件加载失败，使用默认配置');
            return this.GetDefaultConfig();
        }
        config.services.game.clientProtocol = (0, ClientProtocol_1.ResolveClientProtocol)(config.services.game.clientProtocol);
        if (config.services.regist.mode !== undefined &&
            config.services.regist.mode !== 'email' && config.services.regist.mode !== 'invite') {
            throw new Error('Invalid registration mode');
        }
        const allowEmails = config.services.regist.allowEmails;
        if (allowEmails !== undefined && (!Array.isArray(allowEmails) ||
            allowEmails.some(e => typeof e !== 'string' || e !== e.trim().toLowerCase() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)))) {
            throw new Error('Invalid regist.allowEmails: lowercase email strings required');
        }
        if (config.services.game.defaultSuperNono !== undefined &&
            typeof config.services.game.defaultSuperNono !== 'boolean') {
            throw new Error('Invalid defaultSuperNono setting');
        }
        if (config.services.game.cumulativePetExperience !== undefined &&
            typeof config.services.game.cumulativePetExperience !== 'boolean') {
            throw new Error('Invalid cumulativePetExperience setting');
        }
        config.services.game.cumulativePetExperience ??= false;
        return config;
    }
    /**
     * 获取默认配置
     */
    GetDefaultConfig() {
        return {
            services: {
                game: {
                    enabled: true,
                    port: 9999,
                    host: '0.0.0.0',
                    cumulativePetExperience: false
                },
                regist: {
                    enabled: true,
                    mode: 'email'
                },
                email: {
                    enabled: true
                },
                gm: {
                    enabled: true,
                    port: 3002,
                    host: '0.0.0.0',
                    localMode: true
                },
                proxy: {
                    enabled: false,
                    listenPort: 9000,
                    listenHost: '127.0.0.1',
                    webPort: 8080,
                    loginServer: {
                        host: '115.238.192.7',
                        port: 9999
                    },
                    gameServer: {
                        host: '115.238.192.7',
                        port: 27777
                    }
                }
            },
            database: {
                type: 'sqlite',
                path: 'data/seer.db',
                options: {
                    verbose: false
                }
            },
            redis: {
                enabled: false,
                host: 'localhost',
                port: 6379,
                db: 0
            },
            logging: {
                level: 'info',
                directory: 'logs',
                maxFiles: 30
            },
            security: {
                sessionTimeout: 3600,
                maxLoginAttempts: 5,
                lockoutDuration: 300
            }
        };
    }
    /**
     * 获取完整配置
     */
    get Config() {
        return this._config;
    }
    /**
     * 获取RegistServer配置
     */
    get Regist() {
        return this._config.services.regist;
    }
    /**
     * 获取GameServer配置
     */
    get Game() {
        return this._config.services.game;
    }
    /**
     * 获取EmailServer配置
     */
    get Email() {
        return this._config.services.email;
    }
    /**
     * 获取GMServer配置
     */
    get GM() {
        return this._config.services.gm;
    }
    /**
     * 获取ProxyServer配置
     */
    get Proxy() {
        return this._config.services.proxy;
    }
    /**
     * 获取数据库配置
     */
    get Database() {
        return this._config.database;
    }
    /**
     * 获取Redis配置
     */
    get Redis() {
        return this._config.redis;
    }
    /**
     * 获取日志配置
     */
    get Logging() {
        return this._config.logging;
    }
    /**
     * 获取安全配置
     */
    get Security() {
        return this._config.security;
    }
    /**
     * 重新加载配置
     */
    Reload() {
        const configPath = ConfigDefinitions_1.ConfigPaths[ConfigDefinitions_1.ConfigKeys.SERVER_CONFIG];
        ConfigLoader_1.ConfigLoader.Instance.Reload(configPath);
        this._config = this.LoadConfig();
        utils_1.Logger.Info('[ServerConfig] 配置已重新加载');
    }
}
exports.ServerConfig = ServerConfig;
// 导出单例
exports.Config = ServerConfig.Instance;
//# sourceMappingURL=ServerConfig.js.map