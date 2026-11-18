import { BaseProto } from '../../../base/BaseProto';
/**
 * 添加好友请求
 * CMD 2151
 *
 * 请求格式: targetId(4)
 */
export declare class FriendAddReqProto extends BaseProto {
    targetId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=FriendAddReqProto.d.ts.map