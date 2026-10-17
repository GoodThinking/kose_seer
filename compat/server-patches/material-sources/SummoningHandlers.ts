import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { SummoningField } from '../../../../Game/Map/SummoningField';
import { MaterialGames } from '../../../../Game/Map/MaterialGames';
import { MaterialPacket } from './MaterialHandlers';

@Opcode(CommandID.JOIN_GAME, InjectType.NONE)
export class JoinSummoningHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4) {
      await player.SendPacket(new PacketEmpty(CommandID.JOIN_GAME).setResult(5001));
      return;
    }
    const gameId = body.readUInt32BE(0);
    if (player.Data.mapID === SummoningField.MAP_ID) {
      await SummoningField.For(player).Join(gameId);
      return;
    }
    try { MaterialGames.Join(player, gameId); }
    catch {
      await player.SendPacket(new PacketEmpty(CommandID.JOIN_GAME).setResult(5001));
      return;
    }
    await player.SendPacket(new MaterialPacket(CommandID.JOIN_GAME, [gameId]));
  }
}

@Opcode(CommandID.LEAVE_GAME, InjectType.NONE)
export class LeaveSummoningHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (player.Data.mapID !== SummoningField.MAP_ID || body.length !== 4 || body.readUInt32BE(0) !== 1) {
      await player.SendPacket(new PacketEmpty(CommandID.LEAVE_GAME).setResult(5001));
      return;
    }
    // The native appearance notification releases the pad immediately; walking afterward keeps the summoned boss.
    await player.SendPacket(new PacketEmpty(CommandID.LEAVE_GAME));
  }
}
