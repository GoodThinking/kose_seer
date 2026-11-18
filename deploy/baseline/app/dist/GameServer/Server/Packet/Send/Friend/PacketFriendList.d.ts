import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IFriendInfo } from '../../../../../shared/proto/packets/rsp/friend/FriendListRspProto';
/**
 * 好友列表响应包
 * CMD 2158
 */
export declare class PacketFriendList extends BaseProto {
    private _data;
    constructor(friendList: IFriendInfo[], result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketFriendList.d.ts.map