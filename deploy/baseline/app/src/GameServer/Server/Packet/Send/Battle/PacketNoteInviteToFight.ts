import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoteInviteToFightRspProto } from '../../../../../shared/proto/packets/rsp/battle/NoteInviteToFightRspProto';

/**
 * [CMD: 2501 NOTE_INVITE_TO_FIGHT] 对战邀请通知包装器
 */
export class PacketNoteInviteToFight extends BaseProto {
  private _data: Buffer;

  constructor(inviterUserId: number, inviterNick: string, mode: number = 0) {
    super(CommandID.NOTE_INVITE_TO_FIGHT);
    
    const proto = new NoteInviteToFightRspProto();
    proto.inviterUserId = inviterUserId;
    proto.inviterNick = inviterNick;
    proto.mode = mode;
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
