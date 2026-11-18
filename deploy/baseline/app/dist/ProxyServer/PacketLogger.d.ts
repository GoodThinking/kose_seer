import { ICapturedPacket } from './ProxyServer';
/**
 * 数据包日志记录器
 * 将捕获的数据包写入日志文件
 */
export declare class PacketLogger {
    private _logDir;
    private _currentLogFile;
    private _enabled;
    constructor(logDir?: string);
    /**
     * 确保日志目录存在
     */
    private EnsureLogDir;
    /**
     * 创建新的日志文件
     */
    private CreateNewLogFile;
    /**
     * 记录数据包
     */
    LogPacket(packet: ICapturedPacket): void;
    /**
     * 写入分隔线（用于会话开始/结束）
     */
    LogSessionStart(clientAddr: string, remoteAddr: string): void;
    /**
     * 写入会话结束
     */
    LogSessionEnd(clientAddr: string): void;
    /**
     * 启用/禁用日志
     */
    SetEnabled(enabled: boolean): void;
    /**
     * 获取当前日志文件路径
     */
    get CurrentLogFile(): string;
    /**
     * 获取日志目录
     */
    get LogDir(): string;
    /**
     * 是否启用
     */
    get IsEnabled(): boolean;
}
//# sourceMappingURL=PacketLogger.d.ts.map