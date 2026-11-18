import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取好友关系列表响应包
 * CMD 2150: GET_RELATION_LIST
 */
export declare class PacketGetRelationList extends BaseProto {
    private _data;
    constructor(friendList: number[], blackList: number[], result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetRelationList.d.ts.map