import { BaseProto } from '../../../base/BaseProto';
/**
 * 好友请求回复
 * CMD 2152
 *
 * 请求格式: targetId(4) + accept(4)
 */
export declare class FriendAnswerReqProto extends BaseProto {
    targetId: number;
    accept: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=FriendAnswerReqProto.d.ts.map