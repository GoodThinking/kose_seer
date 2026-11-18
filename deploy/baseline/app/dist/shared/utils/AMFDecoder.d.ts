/**
 * AMF3 解码器 - 解析 Flash ByteArray.writeObject() 序列化的数据
 *
 * AMF (Action Message Format) 是 Adobe Flash 使用的二进制序列化格式
 * AMF3 是较新的版本，更紧凑高效
 *
 * 参考: https://en.wikipedia.org/wiki/Action_Message_Format
 */
/**
 * AMF3 类型标记
 */
export declare enum AMF3Type {
    UNDEFINED = 0,
    NULL = 1,
    FALSE = 2,
    TRUE = 3,
    INTEGER = 4,
    DOUBLE = 5,
    STRING = 6,
    XML_DOC = 7,
    DATE = 8,
    ARRAY = 9,
    OBJECT = 10,
    XML = 11,
    BYTE_ARRAY = 12,
    VECTOR_INT = 13,
    VECTOR_UINT = 14,
    VECTOR_DOUBLE = 15,
    VECTOR_OBJECT = 16,
    DICTIONARY = 17
}
/**
 * AMF3 解码器
 */
export declare class AMFDecoder {
    private _buffer;
    private _offset;
    private _stringRefs;
    private _objectRefs;
    private _traitRefs;
    constructor(buffer: Buffer);
    /**
     * 解码 AMF3 数据
     */
    Decode(): unknown;
    /**
     * 获取当前偏移量
     */
    get Offset(): number;
    /**
     * 读取一个值
     */
    private ReadValue;
    private ReadUInt8;
    private ReadDouble;
    /**
     * 读取 U29 变长整数
     * AMF3 使用变长编码，每字节最高位表示是否还有后续字节
     */
    private ReadU29;
    private ReadString;
    private ReadDate;
    private ReadArray;
    private ReadObject;
    private ReadTrait;
    private ReadXML;
    private ReadByteArray;
    private ReadVectorInt;
    private ReadVectorUInt;
    private ReadVectorDouble;
    private ReadVectorObject;
    private ReadDictionary;
}
/**
 * 解码 AMF3 数据的便捷函数
 */
export declare function DecodeAMF(buffer: Buffer): unknown;
/**
 * 格式化 AMF 解码结果为可读字符串
 */
export declare function FormatAMFValue(value: unknown, indent?: number): string;
//# sourceMappingURL=AMFDecoder.d.ts.map