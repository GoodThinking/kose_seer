/**
 * Proto基类
 * 所有协议消息都继承此类
 */
export declare abstract class BaseProto {
    /**
     * 命令ID（通过构造函数传入）
     */
    protected readonly cmdId: number;
    /**
     * 结果码（默认0=成功）
     */
    protected result: number;
    /**
     * 构造函数
     * @param cmdId 命令ID（子类通过super(cmdId)传入）
     */
    constructor(cmdId: number);
    /**
     * 获取命令ID
     */
    getCmdId(): number;
    /**
     * 获取结果码
     */
    getResult(): number;
    /**
     * 设置结果码
     */
    setResult(result: number): this;
    /**
     * 序列化为Buffer
     */
    abstract serialize(): Buffer;
    /**
     * 辅助方法：构建固定长度的字符串Buffer
     */
    protected buildString(str: string, length: number): Buffer;
    /**
     * 辅助方法：从Buffer读取字符串
     */
    protected readString(buffer: Buffer): string;
    /**
     * 辅助方法：构建固定长度的Buffer
     */
    protected buildBuffer(data: string | Buffer | undefined, length: number): Buffer;
}
//# sourceMappingURL=BaseProto.d.ts.map