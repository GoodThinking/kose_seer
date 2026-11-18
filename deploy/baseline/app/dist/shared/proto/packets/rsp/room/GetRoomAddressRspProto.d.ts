import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 10002 GET_ROOM_ADDRES] 获取房间地址响应
 *
 * 响应格式:
 * - session: Buffer (24字节，会话信息)
 * - ip: uint32 (房间服务器IP，十六进制格式)
 * - port: uint16 (房间服务器端口)
 */
export declare class GetRoomAddressRspProto extends BaseProto {
    session: Buffer;
    ip: number;
    port: number;
    constructor();
    serialize(): Buffer;
    setAddress(session: Buffer, ip: number, port: number): this;
}
//# sourceMappingURL=GetRoomAddressRspProto.d.ts.map