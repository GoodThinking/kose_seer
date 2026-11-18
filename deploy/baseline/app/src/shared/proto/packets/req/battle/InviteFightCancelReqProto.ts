import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请请求
 * 
 * 请求格式：
 * - targetUserId: uint32 - 被邀请玩家的ID
 */
export class InviteFightCancelReqProto extends BaseProto {
  targetUserId: number = 0;

  constructor() {
    super(CommandID.INVITE_FIGHT_CANCEL);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }

  static fromBuffer(buffer: Buffer): InviteFightCancelReqProto {
    const proto = new InviteFightCancelReqProto();
    if (buffer.length >= 4) {
      proto.targetUserId = buffer.readUInt32BE(0);
    }
    return proto;
  }
}
