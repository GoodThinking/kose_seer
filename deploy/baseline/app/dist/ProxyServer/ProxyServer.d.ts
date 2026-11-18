/**
 * 捕获的数据包信息
 */
export interface ICapturedPacket {
    id: number;
    timestamp: number;
    direction: 'C2S' | 'S2C';
    cmdID: number;
    cmdName: string;
    cmdDesc: string;
    userID: number;
    result: number;
    bodyLength: number;
    bodyHex: string;
    fields: {
        name: string;
        value: string;
        desc: string;
    }[];
    rawHex: string;
    formatString: string;
}
/**
 * 代理服务器
 * 用于监测客户端与远程服务器之间的通信
 */
export declare class ProxyServer {
    private _server;
    private _webServer;
    private _packetLogger;
    private _running;
    private _packetID;
    private _capturedPackets;
    private _version;
    private _headLength;
    constructor();
    /**
     * 设置连接处理
     */
    private SetupConnectionHandler;
    /**
     * 修改服务器列表响应中的IP/端口
     * 将远程服务器IP替换为代理服务器IP
     */
    private ModifyServerListResponse;
    /**
     * 解析并捕获数据包
     */
    private ParseAndCapture;
    /**
     * 捕获单个数据包
     */
    private CapturePacket;
    /**
     * 将解析后的字符串转换为字段数组
     * 例如: "field1=123, field2="abc"" => [{name: "field1", value: "123", desc: ""}, ...]
     */
    private ParseBodyStringToFields;
    /**
     * 获取所有捕获的数据包
     */
    GetCapturedPackets(): ICapturedPacket[];
    /**
     * 清空捕获的数据包
     */
    ClearPackets(): void;
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
//# sourceMappingURL=ProxyServer.d.ts.map