import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { PacketMapBoss } from '../../Send/Map/PacketMapBoss';
import { SummoningField } from '../../../../Game/Map/SummoningField';

/** Preserve ordinary stationary bosses; map 502 uses the native local shield animation. */
@Opcode(CommandID.ATTACK_BOSS, InjectType.NONE)
export class AttackBossHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    const region = body.length >= 4 ? body.readUInt32BE(0) : 0;
    if (player.Data.mapID === SummoningField.MAP_ID) {
      const accepted = body.length === 4 && SummoningField.For(player).Hit(region);
      await player.SendPacket(new PacketEmpty(CommandID.ATTACK_BOSS).setResult(accepted ? 0 : 5001));
      return;
    }
    const spawn = player.MapSpawnManager as typeof player.MapSpawnManager & {
      HitBoss(mapId: number, region: number): { id: number; region: number; hp: number; pos: number } | undefined;
    };
    const boss = spawn.HitBoss(player.Data.mapID, region);
    if (boss) await player.SendPacket(new PacketMapBoss([boss]));
    await player.SendPacket(new PacketEmpty(CommandID.ATTACK_BOSS));
  }
}
