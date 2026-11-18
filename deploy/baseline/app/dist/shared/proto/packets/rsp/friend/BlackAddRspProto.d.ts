import { BaseProto } from '../../../base/BaseProto';
/**
 * 添加黑名单响应
 * CMD 2154
 *
 * 响应格式: 空包
 */
export declare class BlackAddRspProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=BlackAddRspProto.d.ts.map