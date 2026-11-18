import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { SeerMapUserInfoProto } from '../../../../../shared/proto/common/SeerMapUserInfoProto';
/**
 * 地图玩家列表响应包
 * CMD 1003
 */
export declare class PacketListMapPlayer extends BaseProto {
    private _data;
    constructor(players: SeerMapUserInfoProto[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketListMapPlayer.d.ts.map