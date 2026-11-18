import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 离开地图响应包
 * CMD 1002
 */
export declare class PacketLeaveMap extends BaseProto {
    private _data;
    constructor(userId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketLeaveMap.d.ts.map