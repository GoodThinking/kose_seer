import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 地图热度响应包
 * CMD 1004
 */
export declare class PacketMapHot extends BaseProto {
    private _data;
    constructor(maps: Array<{
        mapId: number;
        onlineCount: number;
    }>);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMapHot.d.ts.map