import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 10003 LEAVE_ROOM] 离开房间响应
 * 
 * 响应格式:
 * - 空响应
 */
export class LeaveRoomRspProto extends BaseProto {
  constructor() {
    super(CommandID.LEAVE_ROOM);
  }

  serialize(): Buffer {
    // 空响应
    return Buffer.alloc(0);
  }
}
