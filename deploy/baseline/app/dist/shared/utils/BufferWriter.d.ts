/**
 * Buffer 写入器 - 简化二进制数据写入
 */
export declare class BufferWriter {
    private _buffer;
    private _offset;
    constructor(size?: number);
    /**
     * 写入无符号32位整数 (大端)
     */
    WriteUInt32(value: number): this;
    /**
     * 写入有符号32位整数 (大端)
     */
    WriteInt32(value: number): this;
    /**
     * 写入无符号16位整数 (大端)
     */
    WriteUInt16(value: number): this;
    /**
     * 写入无符号8位整数
     */
    WriteUInt8(value: number): this;
    /**
     * 写入布尔值 (1 字节)
     */
    WriteBoolean(value: boolean): this;
    /**
     * 写入有符号8位整数
     */
    WriteInt8(value: number): this;
    /**
     * 写入定长字符串 (不足补0)
     */
    WriteString(value: string, length: number): this;
    /**
     * 写入变长字符串 (前置长度)
     */
    WriteVarString(value: string): this;
    /**
     * 写入 UTF 字符串 (ActionScript 格式：前置 uint16 长度)
     */
    WriteUTF(value: string): this;
    /**
     * 写入 32 位浮点数 (大端)
     */
    WriteFloat(value: number): this;
    /**
     * 写入原始字节
     */
    WriteBytes(data: Buffer): this;
    /**
     * 获取已写入的数据
     */
    ToBuffer(): Buffer;
    /**
     * 获取当前偏移量
     */
    get Offset(): number;
    /**
     * 确保容量足够
     */
    private EnsureCapacity;
}
//# sourceMappingURL=BufferWriter.d.ts.map