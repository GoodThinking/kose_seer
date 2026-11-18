import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { InviteToFightRspProto } from '../../../../../shared/proto/packets/rsp/battle/InviteToFightRspProto';

/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战响应包装器
 */
export class PacketInviteToFight extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.INVITE_TO_FIGHT);
    const proto = new InviteToFightRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
