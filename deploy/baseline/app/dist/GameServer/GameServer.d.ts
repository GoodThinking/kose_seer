import './Server/Packet/Recv';
/**
 * 游戏服务器
 */
export declare class GameServer {
    private _server;
    private _sessionManager;
    private _packetBuilder;
    private _loginManager;
    private _registerManager;
    private _serverManager;
    private _handlers;
    private _running;
    constructor();
    /**
     * 注册命令处理器 (通过装饰器自动注册)
     */
    private RegisterHandlers;
    /**
     * 设置连接处理
     */
    private SetupConnectionHandler;
    /**
     * 处理接收到的数据
     */
    private HandleData;
    /**
     * 处理数据包
     */
    private ProcessPacket;
    /**
     * 启动服务器
     */
    Start(): Promise<void>;
    /**
     * 停止服务器
     */
    Stop(): Promise<void>;
    /**
     * 是否正在运行
     */
    get IsRunning(): boolean;
}
//# sourceMappingURL=GameServer.d.ts.map