"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientConfig = void 0;
const ConfigRegistry_1 = require("./ConfigRegistry");
const ConfigDefinitions_1 = require("./ConfigDefinitions");
/**
 * 客户端配置管理器
 * 用于管理发送给客户端的服务器列表（仅静态配置）
 * userCnt 和 friends 需要实时获取
 */
class ClientConfig {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!ClientConfig._instance) {
            ClientConfig._instance = new ClientConfig();
        }
        return ClientConfig._instance;
    }
    /**
     * 获取服务器基础配置列表
     */
    get Servers() {
        const config = ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.CLIENT_CONFIG);
        if (!config || !config.servers || config.servers.length === 0) {
            return this.GetDefaultServers();
        }
        return config.servers;
    }
    /**
     * 获取默认服务器配置
     */
    GetDefaultServers() {
        return [
            {
                onlineID: 1,
                ip: '127.0.0.1',
                port: 9999
            }
        ];
    }
}
exports.ClientConfig = ClientConfig;
//# sourceMappingURL=ClientConfig.js.map