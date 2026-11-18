import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请响应
 * 
 * 响应格式：空包（只有result）
 */
export class InviteFightCancelRspProto extends BaseProto {
  constructor() {
    super(CommandID.INVITE_FIGHT_CANCEL);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
