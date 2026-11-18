import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IPlayerInfo } from '../../../../../shared/models/PlayerModel';
/**
 * GET_MORE_USERINFO 数据包 (2052)
 * 获取更多用户信息响应
 */
export declare class PacketGetMoreUserInfo extends BaseProto {
    private _data;
    constructor(playerData: IPlayerInfo);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetMoreUserInfo.d.ts.map