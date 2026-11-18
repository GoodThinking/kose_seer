import { BaseProto } from '../../../base/BaseProto';
/**
 * 好友信息接口
 */
export interface IFriendInfo {
    userId: number;
    nickname: string;
    color: number;
    isOnline: boolean;
}
/**
 * 好友列表响应
 * CMD 2158
 *
 * 响应格式:
 * - friendCount(4)
 * - [FriendInfo]...
 *   - userID(4)
 *   - nickname(16)
 *   - color(4)
 *   - isOnline(1)
 */
export declare class FriendListRspProto extends BaseProto {
    friendList: IFriendInfo[];
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
    setFriendList(friendList: IFriendInfo[]): this;
}
//# sourceMappingURL=FriendListRspProto.d.ts.map