/**
 * HTTP 代理服务器配置
 */
export interface IHttpProxyConfig {
    listenPort: number;
    tcpProxyHost: string;
    tcpProxyPort: number;
    remoteHttpHost: string;
}
/**
 * HTTP 代理服务器
 * 拦截 ip.txt 请求，返回本地 TCP 代理地址
 * 其他请求转发到远程服务器
 */
export declare class HttpProxyServer {
    private _server;
    private _config;
    private _running;
    constructor(config: IHttpProxyConfig);
    /**
     * 处理 HTTP 请求
     */
    private HandleRequest;
    /**
     * 处理 ip.txt 请求 - 返回本地 TCP 代理地址
     */
    private HandleIpTxt;
    /**
     * 转发请求到远程 HTTPS 服务器
     */
    private ProxyToRemote;
    /**
     * 启动服务器
     */
    Start(): void;
    /**
     * 停止服务器
     */
    Stop(): void;
    /**
     * 是否正在运行
     */
    get IsRunning(): boolean;
}
//# sourceMappingURL=HttpProxyServer.d.ts.map