/**
 * 服务器基础信息接口（仅静态配置）
 */
export interface IServerBaseInfo {
    onlineID: number;
    ip: string;
    port: number;
}
/**
 * 客户端配置接口
 */
export interface IClientConfig {
    servers: IServerBaseInfo[];
}
/**
 * 客户端配置管理器
 * 用于管理发送给客户端的服务器列表（仅静态配置）
 * userCnt 和 friends 需要实时获取
 */
export declare class ClientConfig {
    private static _instance;
    private constructor();
    static get Instance(): ClientConfig;
    /**
     * 获取服务器基础配置列表
     */
    get Servers(): IServerBaseInfo[];
    /**
     * 获取默认服务器配置
     */
    private GetDefaultServers;
}
//# sourceMappingURL=ClientConfig.d.ts.map