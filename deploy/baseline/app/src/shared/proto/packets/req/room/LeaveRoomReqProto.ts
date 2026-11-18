import { CommandID } from '../../../../protocol';
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
export class LeaveRoomReqProto extends BaseProto {
  param1: number = 0;
  mapId: number = 0;
  catchTime: number = 0;
  changeShape: number = 0;
  actionType: number = 0;

  constructor() {
    super(CommandID.LEAVE_ROOM);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): LeaveRoomReqProto {
    const proto = new LeaveRoomReqProto();
    
    if (buffer.length >= 20) {
      proto.param1 = buffer.readUInt32BE(0);
      proto.mapId = buffer.readUInt32BE(4);
      proto.catchTime = buffer.readUInt32BE(8);
      proto.changeShape = buffer.readUInt32BE(12);
      proto.actionType = buffer.readUInt32BE(16);
    }
    
    return proto;
  }
}
