import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IBossInfo } from '../../../../../shared/proto/packets/rsp/map/MapBossRspProto';
/**
 * [CMD: 2021 MAP_BOSS] 地图BOSS列表响应包
 */
export declare class PacketMapBoss extends BaseProto {
    private _data;
    constructor(bosses: IBossInfo[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMapBoss.d.ts.map