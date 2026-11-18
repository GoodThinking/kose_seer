import { BaseProto } from '../../../base/BaseProto';
/**
 * 移除黑名单请求
 * CMD 2155
 *
 * 请求格式: targetId(4)
 */
export declare class BlackRemoveReqProto extends BaseProto {
    targetId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=BlackRemoveReqProto.d.ts.map