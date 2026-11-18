import { BaseProto } from '../../../base/BaseProto';
/**
 * 删除好友请求
 * CMD 2153
 *
 * 请求格式: targetId(4)
 */
export declare class FriendRemoveReqProto extends BaseProto {
    targetId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=FriendRemoveReqProto.d.ts.map