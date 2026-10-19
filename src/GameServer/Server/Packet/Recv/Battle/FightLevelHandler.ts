import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { PacketFightLevel } from '../../Send/Battle/PacketFightLevel';
import {
  BRAVE_TOWER_MAX,
  braveTowerBosses,
  braveTowerEnemyLevel,
  resolveBraveTowerFloor,
  saveBraveTowerStage,
} from '../../../../Game/Battle/BraveTower';

@Opcode(CommandID.CHOICE_FIGHT_LEVEL, InjectType.NONE)
export class ChoiceFightLevelHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const requested = body.length >= 4 ? body.readUInt32BE(0) : 0;
    const floor = resolveBraveTowerFloor(requested, player.Data.curStage || 0, player.Data.maxStage || 0);
    player.Data.curStage = floor;
    await saveBraveTowerStage(player.Uid, player.Data.curStage, player.Data.maxStage || 0);
    await player.SendPacket(new PacketFightLevel(
      CommandID.CHOICE_FIGHT_LEVEL,
      floor,
      braveTowerBosses(floor)
    ));
  }
}

@Opcode(CommandID.START_FIGHT_LEVEL, InjectType.NONE)
export class StartFightLevelHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const floor = Math.min(BRAVE_TOWER_MAX, Math.max(1, player.Data.curStage || 1));
    const healthy = player.PetManager.GetPetsInBag().some(pet => pet.hp > 0);
    if (!healthy) {
      await player.SendPacket(new PacketEmpty(CommandID.START_FIGHT_LEVEL).setResult(10017));
      return;
    }

    const bosses = braveTowerBosses(floor);
    const next = floor >= BRAVE_TOWER_MAX ? [] : braveTowerBosses(floor + 1);
    await player.SendPacket(new PacketFightLevel(CommandID.START_FIGHT_LEVEL, floor, next));
    await (player.BattleManager as unknown as {
      StartBraveTowerBattle(enemyId: number, enemyLevel: number, floor: number): Promise<boolean>;
    }).StartBraveTowerBattle(bosses[0], braveTowerEnemyLevel(floor), floor);
  }
}

@Opcode(CommandID.LEAVE_FIGHT_LEVEL, InjectType.NONE)
export class LeaveFightLevelHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    await player.SendPacket(new PacketEmpty(CommandID.LEAVE_FIGHT_LEVEL));
  }
}
