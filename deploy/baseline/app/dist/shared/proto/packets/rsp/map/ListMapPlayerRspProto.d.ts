import { BaseProto } from '../../../base/BaseProto';
import { SeerMapUserInfoProto } from '../../../common/SeerMapUserInfoProto';
/**
 * [CMD: 2003 LIST_MAP_PLAYER] 地图玩家列表响应
 */
export declare class ListMapPlayerRspProto extends BaseProto {
    players: SeerMapUserInfoProto[];
    constructor();
    serialize(): Buffer;
    setPlayers(players: SeerMapUserInfoProto[]): this;
    addPlayer(player: SeerMapUserInfoProto): this;
}
//# sourceMappingURL=ListMapPlayerRspProto.d.ts.map