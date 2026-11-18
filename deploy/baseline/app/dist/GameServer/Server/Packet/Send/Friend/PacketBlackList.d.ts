import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IBlackInfo } from '../../../../../shared/proto/packets/rsp/friend/BlackListRspProto';
/**
 * 黑名单列表响应包
 * CMD 2159
 */
export declare class PacketBlackList extends BaseProto {
    private _data;
    constructor(blackList: IBlackInfo[], result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketBlackList.d.ts.map