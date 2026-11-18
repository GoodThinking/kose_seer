import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 10003 LEAVE_ROOM] 离开房间请求
 *
 * 请求格式:
 * - param1 (uint32) - 固定值1
 * - mapId (uint32) - 目标地图ID
 * - catchTime (uint32) - 精灵捕获时间
 * - changeShape (uint32) - 变身状态
 * - actionType (uint32) - 动作类型
 */
export declare class LeaveRoomReqProto extends BaseProto {
    param1: number;
    mapId: number;
    catchTime: number;
    changeShape: number;
    actionType: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): LeaveRoomReqProto;
}
//# sourceMappingURL=LeaveRoomReqProto.d.ts.map