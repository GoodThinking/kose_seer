import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

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
export class RoomLoginReqProto extends BaseProto {
  session: Buffer = Buffer.alloc(24);
  catchTime: number = 0;
  param1: number = 0;
  roomId: number = 0;
  param2: number = 0;
  param3: number = 0;

  constructor() {
    super(CommandID.ROOM_LOGIN);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): RoomLoginReqProto {
    const proto = new RoomLoginReqProto();
    if (buffer.length >= 44) {
      // 读取session (24字节)
      proto.session = buffer.slice(0, 24);
      
      let offset = 24;
      // 读取catchTime
      proto.catchTime = buffer.readUInt32BE(offset);
      offset += 4;
      
      // 读取param1
      proto.param1 = buffer.readUInt32BE(offset);
      offset += 4;
      
      // 读取roomId
      proto.roomId = buffer.readUInt32BE(offset);
      offset += 4;
      
      // 读取param2
      proto.param2 = buffer.readUInt32BE(offset);
      offset += 4;
      
      // 读取param3
      proto.param3 = buffer.readUInt32BE(offset);
    }
    return proto;
  }
}
