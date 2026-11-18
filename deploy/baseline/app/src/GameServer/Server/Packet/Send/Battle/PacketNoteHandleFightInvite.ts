import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { NoteHandleFightInviteRspProto } from '../../../../../shared/proto/packets/rsp/battle/NoteHandleFightInviteRspProto';

/**
 * [CMD: 2502 NOTE_HANDLE_FIGHT_INVITE] 处理邀请通知包装器
 */
export class PacketNoteHandleFightInvite extends BaseProto {
  private _data: Buffer;

  constructor(targetUserId: number, targetNick: string, accept: number) {
    super(CommandID.NOTE_HANDLE_FIGHT_INVITE);
    
    const proto = new NoteHandleFightInviteRspProto();
    proto.targetUserId = targetUserId;
    proto.targetNick = targetNick;
    proto.accept = accept;
    
    this._data = proto.serialize();
  }

  public serialize(): Buffer {
    return this._data;
  }
}
