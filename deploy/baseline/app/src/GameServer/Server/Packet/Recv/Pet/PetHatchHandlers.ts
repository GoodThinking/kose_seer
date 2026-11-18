import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { Opcode, InjectType } from '../../../../../shared/decorators/Opcode';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Logger } from '../../../../../shared/utils/Logger';
import { EssenceHatching, EssenceHatchState, InvalidEssenceHatch, EssenceIncubatorBusy } from '../../../../Game/Pet/EssenceHatching';
import { IHandler, IClientSession } from '../../IHandler';
import { PacketEmpty } from '../../Send/PacketEmpty';

class PacketEssenceHatchState extends BaseProto {
  constructor(private state: EssenceHatchState) {super(CommandID.PET_HATCH_GET);}
  serialize(): Buffer {
    const body = Buffer.alloc(16);
    body.writeUInt32BE(this.state.active ? 1 : 0, 0);
    body.writeUInt32BE(this.state.remaining, 4);
    body.writeUInt32BE(this.state.petId, 8);
    body.writeUInt32BE(this.state.catchTime, 12);
    return body;
  }
}

class PacketEssenceHatchStarted extends BaseProto {
  constructor(private seconds: number) {super(CommandID.PET_HATCH);}
  serialize(): Buffer {const body = Buffer.alloc(4); body.writeUInt32BE(this.seconds); return body;}
}

@Opcode(CommandID.PET_HATCH, InjectType.NONE)
export class PetHatchHandler implements IHandler {
  async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4) {await player.SendPacket(new PacketEmpty(CommandID.PET_HATCH).setResult(5001)); return;}
    let seconds: number;
    try {seconds = await new EssenceHatching(player).Start(body.readUInt32BE(0));}
    catch (error) {
      const code = error instanceof InvalidEssenceHatch ? 5001 : error instanceof EssenceIncubatorBusy ? 5002 : 5000;
      if (code === 5000) Logger.Error('[PetHatch] Failed to start incubation', error as Error);
      await player.SendPacket(new PacketEmpty(CommandID.PET_HATCH).setResult(code));
      return;
    }
    try {await player.SendPacket(new PacketEssenceHatchStarted(seconds));}
    catch (error) {Logger.Error('[PetHatch] Incubation saved; response delivery failed', error as Error);}
  }
}

@Opcode(CommandID.PET_HATCH_GET, InjectType.NONE)
export class PetHatchGetHandler implements IHandler {
  async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 0) {await player.SendPacket(new PacketEmpty(CommandID.PET_HATCH_GET).setResult(5001)); return;}
    let state: EssenceHatchState;
    try {state = await new EssenceHatching(player).Get();}
    catch (error) {
      if (!(error instanceof InvalidEssenceHatch)) Logger.Error('[PetHatchGet] Failed to read incubation', error as Error);
      await player.SendPacket(new PacketEmpty(CommandID.PET_HATCH_GET).setResult(error instanceof InvalidEssenceHatch ? 5001 : 5000));
      return;
    }
    try {await player.SendPacket(new PacketEssenceHatchState(state));}
    catch (error) {Logger.Error('[PetHatchGet] State committed; response delivery failed', error as Error);}
  }
}
