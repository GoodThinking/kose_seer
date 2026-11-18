import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战请求
 * 
 * 请求格式：
 * - targetUserId: uint32 - 被邀请玩家的ID
 * - mode: uint32 - 对战模式（1=单挑，2=多精灵）
 */
export class InviteToFightReqProto extends BaseProto {
  targetUserId: number = 0;
  mode: number = 2; // 默认多精灵模式

  constructor() {
    super(CommandID.INVITE_TO_FIGHT);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): InviteToFightReqProto {
    const proto = new InviteToFightReqProto();
    if (buffer.length >= 4) {
      proto.targetUserId = buffer.readUInt32BE(0);  // 客户端使用大端序
    }
    if (buffer.length >= 8) {
      proto.mode = buffer.readUInt32BE(4);  // 客户端使用大端序
    }
    return proto;
  }
}
