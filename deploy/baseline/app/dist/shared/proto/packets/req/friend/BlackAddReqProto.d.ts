import { BaseProto } from '../../../base/BaseProto';
/**
 * 添加黑名单请求
 * CMD 2154
 *
 * 请求格式: targetId(4)
 */
export declare class BlackAddReqProto extends BaseProto {
    targetId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=BlackAddReqProto.d.ts.map