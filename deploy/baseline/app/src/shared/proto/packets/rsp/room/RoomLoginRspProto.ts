import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 10001 ROOM_LOGIN] 房间登录响应
 * 
 * 响应格式:
 * - 空响应，只返回result
 */
export class RoomLoginRspProto extends BaseProto {
  constructor() {
    super(CommandID.ROOM_LOGIN);
  }

  serialize(): Buffer {
    // 空响应
    return Buffer.alloc(0);
  }
}
