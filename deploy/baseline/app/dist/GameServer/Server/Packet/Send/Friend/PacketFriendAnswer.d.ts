import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 好友请求回复响应包
 * CMD 2152
 */
export declare class PacketFriendAnswer extends BaseProto {
    private _data;
    constructor(accept: number, result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketFriendAnswer.d.ts.map