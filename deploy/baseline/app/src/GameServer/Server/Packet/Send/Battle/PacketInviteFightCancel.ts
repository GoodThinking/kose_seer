import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { InviteFightCancelRspProto } from '../../../../../shared/proto/packets/rsp/battle/InviteFightCancelRspProto';

/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请响应包装器
 */
export class PacketInviteFightCancel extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.INVITE_FIGHT_CANCEL);
    const proto = new InviteFightCancelRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
