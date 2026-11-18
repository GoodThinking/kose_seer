import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IOnlineInfo } from '../../../../../shared/proto/packets/rsp/friend/SeeOnlineRspProto';
/**
 * 查看在线状态响应包
 * CMD 2157
 */
export declare class PacketSeeOnline extends BaseProto {
    private _data;
    constructor(onlineList: IOnlineInfo[], result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketSeeOnline.d.ts.map