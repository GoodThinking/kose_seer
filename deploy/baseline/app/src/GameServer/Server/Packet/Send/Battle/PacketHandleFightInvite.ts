import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { HandleFightInviteRspProto } from '../../../../../shared/proto/packets/rsp/battle/HandleFightInviteRspProto';

/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请响应包装器
 */
export class PacketHandleFightInvite extends BaseProto {
  private _data: Buffer;

  constructor() {
    super(CommandID.HANDLE_FIGHT_INVITE);
    const proto = new HandleFightInviteRspProto();
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
