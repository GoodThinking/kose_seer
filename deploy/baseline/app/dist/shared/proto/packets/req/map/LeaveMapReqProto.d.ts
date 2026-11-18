import { BaseProto } from '../../../base/BaseProto';
/**
 * 离开地图请求
 * CMD: 2002 LEAVE_MAP
 */
export declare class LeaveMapReqProto extends BaseProto {
    mapId: number;
    mapType: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=LeaveMapReqProto.d.ts.map