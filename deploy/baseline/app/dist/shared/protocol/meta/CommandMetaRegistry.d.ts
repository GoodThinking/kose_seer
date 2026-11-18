/**
 * 字段类型定义
 */
export type FieldType = 'uint8' | 'uint16' | 'uint32' | 'int32' | 'string' | 'varstring' | 'bytes' | 'hex' | 'amf' | 'array' | 'bytearray' | 'boolarray' | 'bitarray';
/**
 * 字段定义
 */
export interface IFieldDef {
    name: string;
    type: FieldType;
    length?: number;
    desc?: string;
    arrayCountField?: string;
    arrayFields?: IFieldDef[];
    lengthField?: string;
    nestedArrays?: boolean;
}
/**
 * 命令元数据定义
 */
export interface ICommandMeta {
    cmdID: number;
    name: string;
    desc: string;
    request?: IFieldDef[];
    response?: IFieldDef[];
}
/**
 * 命令元数据注册表
 */
export declare class CommandMetaRegistry {
    private _metas;
    /**
     * 注册命令元数据
     */
    Register(meta: ICommandMeta): void;
    /**
     * 批量注册命令元数据
     */
    RegisterBatch(metas: ICommandMeta[]): void;
    /**
     * 获取命令元数据
     */
    Get(cmdID: number): ICommandMeta | undefined;
    /**
     * 获取字段格式字符串
     * 例如: "maxOnlineID(4) + isVIP(4) + onlineCnt(4) + servers..."
     */
    GetFormatString(cmdID: number, isRequest: boolean): string;
    /**
     * 获取字段大小
     */
    private GetFieldSize;
    /**
     * 解析并格式化Body内容
     */
    ParseBody(cmdID: number, body: Buffer, isRequest: boolean): string;
    /**
     * 智能推断并解析Body内容
     * 当没有元数据定义时，尝试推断字段类型
     */
    private ParseBodyWithInference;
    /**
     * 推断字段类型
     * 返回推断的类型、值和大小
     */
    private InferFieldType;
    /**
     * 检查字符串是否可打印
     */
    private IsPrintableString;
    /**
     * 解析字段
     */
    private ParseFields;
    /**
     * 读取单个字段
     */
    private ReadField;
    /**
     * 格式化为十六进制
     */
    private FormatHex;
}
//# sourceMappingURL=CommandMetaRegistry.d.ts.map