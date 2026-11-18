import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战响应
 * 
 * 响应格式：空包（只有result）
 */
export class InviteToFightRspProto extends BaseProto {
  constructor() {
    super(CommandID.INVITE_TO_FIGHT);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
