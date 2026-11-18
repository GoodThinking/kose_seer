import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 删除好友响应包
 * CMD 2153
 */
export declare class PacketFriendRemove extends BaseProto {
    private _data;
    constructor(result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketFriendRemove.d.ts.map