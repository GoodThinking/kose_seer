import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取好友关系列表响应
 * CMD 2150: GET_RELATION_LIST
 *
 * 响应格式：
 * - friendCount (4 bytes): 好友数量
 * - friendList: 好友列表（每个好友4字节userID）
 * - blackCount (4 bytes): 黑名单数量
 * - blackList: 黑名单列表（每个4字节userID）
 */
export declare class GetRelationListRspProto extends BaseProto {
    private friendList;
    private blackList;
    constructor(friendList?: number[], blackList?: number[]);
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=GetRelationListRspProto.d.ts.map