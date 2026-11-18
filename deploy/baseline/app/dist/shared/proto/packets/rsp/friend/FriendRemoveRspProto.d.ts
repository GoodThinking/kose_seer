import { BaseProto } from '../../../base/BaseProto';
/**
 * 删除好友响应
 * CMD 2153
 *
 * 响应格式: 空包
 */
export declare class FriendRemoveRspProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=FriendRemoveRspProto.d.ts.map