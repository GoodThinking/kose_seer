import { BaseProto } from '../../../base/BaseProto';
/**
 * 移除黑名单响应
 * CMD 2155
 *
 * 响应格式: 空包
 */
export declare class BlackRemoveRspProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=BlackRemoveRspProto.d.ts.map