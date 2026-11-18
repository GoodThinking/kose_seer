import { BaseProto } from '../../../base/BaseProto';
/**
 * 地图在线信息
 */
export interface IMapOnlineInfo {
    mapId: number;
    onlineCount: number;
}
/**
 * [CMD: 1004 MAP_HOT] 地图热度响应
 */
export declare class MapHotRspProto extends BaseProto {
    maps: IMapOnlineInfo[];
    constructor();
    serialize(): Buffer;
    setMaps(maps: IMapOnlineInfo[]): this;
}
//# sourceMappingURL=MapHotRspProto.d.ts.map