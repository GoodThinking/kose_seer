import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { FunctionalItemError, UseLearningMultiplierItem } from '../../../../Game/Item/FunctionalConsumable';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.USE_STUDY_ITEM, InjectType.NONE)
export class UseStudyItemHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4) {
      await player.SendPacket(new PacketEmpty(CommandID.USE_STUDY_ITEM).setResult(5001));
      return;
    }
    try {
      await UseLearningMultiplierItem(player, body.readUInt32BE(0));
      await player.SendPacket(new PacketEmpty(CommandID.USE_STUDY_ITEM));
    } catch (error) {
      Logger.Error('[FunctionalItem] Learning multiplier use failed',
        error instanceof Error ? error : new Error(String(error)));
      await player.SendPacket(new PacketEmpty(CommandID.USE_STUDY_ITEM).setResult(
        error instanceof FunctionalItemError ? error.code : 5000));
    }
  }
}
