import { BaseProto } from '../../../base/BaseProto';
/**
 * 好友请求回复响应
 * CMD 2152
 *
 * 响应格式: accept(4)
 */
export declare class FriendAnswerRspProto extends BaseProto {
    accept: number;
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
    setAccept(accept: number): this;
}
//# sourceMappingURL=FriendAnswerRspProto.d.ts.map