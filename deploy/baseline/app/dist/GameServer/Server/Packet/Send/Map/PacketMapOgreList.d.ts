import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IOgreSlot } from '../../../../../shared/proto/packets/rsp/map/MapOgreListRspProto';
/**
 * [CMD: 2004 MAP_OGRE_LIST] 地图野怪列表响应包
 */
export declare class PacketMapOgreList extends BaseProto {
    private _data;
    constructor(ogres: IOgreSlot[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketMapOgreList.d.ts.map