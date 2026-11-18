import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 10001 ROOM_LOGIN] 房间登录请求
 *
 * 请求格式:
 * - session: Buffer (24字节)
 * - catchTime: uint32 (精灵捕获时间)
 * - param1: uint32
 * - roomId: uint32
 * - param2: uint32
 * - param3: uint32
 */
export declare class RoomLoginReqProto extends BaseProto {
    session: Buffer;
    catchTime: number;
    param1: number;
    roomId: number;
    param2: number;
    param3: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): RoomLoginReqProto;
}
//# sourceMappingURL=RoomLoginReqProto.d.ts.map