import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 添加好友响应包
 * CMD 2151
 */
export declare class PacketFriendAdd extends BaseProto {
    private _data;
    constructor(targetId: number, result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketFriendAdd.d.ts.map