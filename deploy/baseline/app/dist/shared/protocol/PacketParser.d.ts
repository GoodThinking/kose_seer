import { HeadInfo } from './HeadInfo';
/**
 * 数据包解析器
 */
export declare class PacketParser {
    private _buffer;
    private _version;
    private _headLength;
    constructor(version?: string);
    /**
     * 追加数据
     */
    Append(data: Buffer): void;
    /**
     * 尝试解析一个完整的数据包
     */
    TryParse(): {
        head: HeadInfo;
        body: Buffer;
    } | null;
    /**
     * 清空缓冲区
     */
    Clear(): void;
}
//# sourceMappingURL=PacketParser.d.ts.map