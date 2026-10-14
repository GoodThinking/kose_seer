import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { ExperienceReceiver, ReceiverAlreadyClaimed } from '../../../../Game/NoNo/ExperienceReceiver';
import { Logger } from '../../../../../shared/utils';

class PacketReceiverCount extends BaseProto {
  constructor(private count: number) { super(CommandID.TALK_COUNT); }
  serialize(): Buffer { const body = Buffer.alloc(4); body.writeUInt32BE(this.count); return body; }
}
class PacketReceiverReward extends BaseProto {
  constructor(private experience: number) { super(CommandID.TALK_CATE); }
  serialize(): Buffer {
    const body = Buffer.alloc(16);
    body.writeUInt32BE(1, 4); // DayTalkInfo: no inputs, one output.
    // Output id 0 is an unused placeholder for the fixed old Nieo receiver UI.
    // Its callback reads only count; no standard reward-id semantics are asserted.
    body.writeUInt32BE(this.experience, 12);
    return body;
  }
}
@Opcode(CommandID.TALK_COUNT, InjectType.NONE)
export class TalkCountHandler implements IHandler {
  async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    if (!session.Player) return;
    if (body.length !== 4) { await session.Player.SendPacket(new PacketEmpty(CommandID.TALK_COUNT).setResult(5001)); return; }
    try {
      const count = await new ExperienceReceiver(session.Player).Count(body.readUInt32BE(0));
      await session.Player.SendPacket(new PacketReceiverCount(count));
    } catch {
      await session.Player.SendPacket(new PacketEmpty(CommandID.TALK_COUNT).setResult(5001));
    }
  }
}
@Opcode(CommandID.TALK_CATE, InjectType.NONE)
export class TalkCateHandler implements IHandler {
  async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    if (!session.Player) return;
    if (body.length !== 4) { await session.Player.SendPacket(new PacketEmpty(CommandID.TALK_CATE).setResult(5001)); return; }
    let experience: number;
    try {
      experience = await new ExperienceReceiver(session.Player).Claim(body.readUInt32BE(0));
    } catch (error) {
      await session.Player.SendPacket(new PacketEmpty(CommandID.TALK_CATE).setResult(error instanceof ReceiverAlreadyClaimed ? 5002 : 5000));
      return;
    }
    try { await session.Player.SendPacket(new PacketReceiverReward(experience)); }
    catch (error) { Logger.Error('[TalkCate] Reward committed; response delivery failed', error as Error); }
  }
}
