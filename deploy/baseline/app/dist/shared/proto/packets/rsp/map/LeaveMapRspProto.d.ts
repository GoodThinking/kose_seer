import { BaseProto } from '../../../base/BaseProto';
/**
 * 离开地图响应
 * CMD: 2002 LEAVE_MAP
 */
export declare class LeaveMapRspProto extends BaseProto {
    userId: number;
    constructor(userId?: number);
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=LeaveMapRspProto.d.ts.map