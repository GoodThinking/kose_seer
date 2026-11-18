import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 10002 GET_ROOM_ADDRES] 获取房间地址请求
 *
 * 请求格式:
 * - targetUserId: uint32 (目标用户ID)
 */
export declare class GetRoomAddressReqProto extends BaseProto {
    targetUserId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): GetRoomAddressReqProto;
}
//# sourceMappingURL=GetRoomAddressReqProto.d.ts.map