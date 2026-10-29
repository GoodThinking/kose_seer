import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { ConfigLoader } from '../../../../../shared/config/ConfigLoader';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { MaterialGames } from '../../../../Game/Map/MaterialGames';
import { GrantMaterials } from '../../../../Game/Item/MaterialRewards';
import type { PlayerInstance } from '../../../../Game/Player/PlayerInstance';

export class MaterialPacket extends BaseProto {
  constructor(command: number, private readonly values: number[]) { super(command); }
  public serialize(): Buffer {
    const body = Buffer.alloc(this.values.length * 4);
    this.values.forEach((value, index) => body.writeUInt32BE(value, index * 4));
    return body;
  }
}

@Opcode(CommandID.GAME_OVER, InjectType.NONE)
export class MaterialGameOverHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 8) {
      await player.SendPacket(new PacketEmpty(CommandID.GAME_OVER).setResult(5001));
      return;
    }
    const score = body.readUInt32BE(0);
    let rewards: { itemId: number; count: number }[];
    try { rewards = await MaterialGames.Finish(player, score, body.readUInt32BE(4)); }
    catch {
      await player.SendPacket(new PacketEmpty(CommandID.GAME_OVER).setResult(5001));
      return;
    }
    await player.SendPacket(new MaterialPacket(CommandID.GAME_OVER,
      [score, 0, 0, 0, rewards.length, ...rewards.flatMap(item => [item.itemId, item.count])]));
  }
}

@Opcode(CommandID.TEAM_PK_ACTIVE_GET_STONE, InjectType.NONE)
export class FortressMaterialHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    const config = ConfigLoader.Instance.LoadJson<{ fortress: { mapId: number; itemId: number; count: number } }>(
      'data/json/material-sources.json');
    if (!config) throw new Error('Material source configuration missing');
    const field = config.fortress;
    try {
      if (body.length) throw new Error('Invalid supply collection request');
      await GrantMaterials(player, () => {
        if (player.Data.mapID !== field.mapId) throw new Error('Outside fortress supply field');
        return [{ itemId: field.itemId, count: field.count }];
      });
    } catch {
      await player.SendPacket(new PacketEmpty(CommandID.TEAM_PK_ACTIVE_GET_STONE).setResult(5001));
      return;
    }
    await player.SendPacket(new MaterialPacket(CommandID.TEAM_PK_ACTIVE_GET_STONE, [field.itemId, field.count]));
  }
}

const openedDarkGate = new WeakSet<PlayerInstance>();
function darkGate(player: PlayerInstance): { mapId: number; door: number; petId: number } {
  const config = ConfigLoader.Instance.LoadJson<{ darkGate: { mapId: number; door: number; petId: number } }>(
    'data/json/material-sources.json');
  if (!config) throw new Error('Material source configuration missing');
  const gate = config.darkGate;
  if (player.Data.mapID !== gate.mapId) throw new Error('Outside dark arena');
  if (!player.Data.superNono && !player.ItemManager.ItemData.ItemList.some(item => item.itemId === 400053 && item.count > 0)) {
    throw new Error('Dark key or Super NoNo required');
  }
  return gate;
}

@Opcode(CommandID.OPEN_DARKPORTAL, InjectType.NONE)
export class OpenMaterialDarkGateHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    let petId: number;
    try {
      const gate = darkGate(player);
      if (body.length !== 4 || body.readUInt32BE(0) !== gate.door) throw new Error('Unsupported dark gate');
      petId = gate.petId;
      openedDarkGate.add(player);
    } catch {
      await player.SendPacket(new PacketEmpty(CommandID.OPEN_DARKPORTAL).setResult(5001));
      return;
    }
    await player.SendPacket(new MaterialPacket(CommandID.OPEN_DARKPORTAL, [petId]));
  }
}

@Opcode(CommandID.FIGHT_DARKPORTAL, InjectType.NONE)
export class FightMaterialDarkGateHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    try {
      darkGate(player);
      if (body.length || !openedDarkGate.delete(player)) throw new Error('Dark gate not opened');
    } catch {
      await player.SendPacket(new PacketEmpty(CommandID.FIGHT_DARKPORTAL).setResult(5001));
      return;
    }
    await player.SendPacket(new PacketEmpty(CommandID.FIGHT_DARKPORTAL));
    await player.BattleManager.HandleChallengeBoss(player.Data.mapID, 0);
  }
}

@Opcode(CommandID.LEAVE_DARKPORTAL, InjectType.NONE)
export class LeaveMaterialDarkGateHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    openedDarkGate.delete(player);
    await player.SendPacket(new PacketEmpty(CommandID.LEAVE_DARKPORTAL));
  }
}
