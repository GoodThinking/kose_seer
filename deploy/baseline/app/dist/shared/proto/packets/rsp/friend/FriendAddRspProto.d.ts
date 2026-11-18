import { BaseProto } from '../../../base/BaseProto';
/**
 * 添加好友响应
 * CMD 2151
 *
 * 响应格式: targetId(4)
 */
export declare class FriendAddRspProto extends BaseProto {
    targetId: number;
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
    setTargetId(targetId: number): this;
}
//# sourceMappingURL=FriendAddRspProto.d.ts.map