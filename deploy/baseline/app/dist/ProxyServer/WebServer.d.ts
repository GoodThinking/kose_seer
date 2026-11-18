import { ICapturedPacket } from './ProxyServer';
/**
 * Web GUI 服务器
 */
export declare class WebServer {
    private _httpServer;
    private _wsServer;
    private _clients;
    private _proxyServer;
    private _running;
    private _publicDir;
    private _webPort;
    constructor(proxyServer: {
        GetCapturedPackets(): ICapturedPacket[];
        ClearPackets(): void;
    }, webPort?: number);
    /**
     * 处理 HTTP 请求
     */
    private HandleRequest;
    /**
     * 处理 API 请求
     */
    private HandleAPI;
    /**
     * 广播数据包到所有 WebSocket 客户端
     */
    BroadcastPacket(packet: ICapturedPacket): void;
    /**
     * 启动服务器
     */
    Start(): void;
    /**
     * 停止服务器
     */
    Stop(): Promise<void>;
    /**
     * 是否正在运行
     */
    get IsRunning(): boolean;
}
//# sourceMappingURL=WebServer.d.ts.map