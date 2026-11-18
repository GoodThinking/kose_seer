import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 10002 GET_ROOM_ADDRES] 获取房间地址请求
 * 
 * 请求格式:
 * - targetUserId: uint32 (目标用户ID)
 */
export class GetRoomAddressReqProto extends BaseProto {
  targetUserId: number = 0;

  constructor() {
    super(CommandID.GET_ROOM_ADDRES);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): GetRoomAddressReqProto {
    const proto = new GetRoomAddressReqProto();
    if (buffer.length >= 4) {
      proto.targetUserId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
