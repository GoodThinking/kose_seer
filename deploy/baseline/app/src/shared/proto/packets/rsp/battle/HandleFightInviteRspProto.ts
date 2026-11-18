import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请响应
 * 
 * 响应格式：空包（只有result）
 */
export class HandleFightInviteRspProto extends BaseProto {
  constructor() {
    super(CommandID.HANDLE_FIGHT_INVITE);
  }

  serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
