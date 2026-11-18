import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { ExperienceReceiver, ReceiverAlreadyClaimed } from '../../../../Game/NoNo/ExperienceReceiver';
import { SuperAnalyzer, AnalyzerAlreadyClaimed } from '../../../../Game/NoNo/SuperAnalyzer';
import { SuperNonoCoins } from '../../../../Game/NoNo/SuperNonoCoins';
import { Mining } from '../../../../Game/Item/Mining';
import { GachaTicket, GachaTicketAlreadyClaimed } from '../../../../Game/Item/GachaTicket';
const { HelkaCapsule, HelkaCapsuleAlreadyClaimed } = require('../../../../Game/Item/HelkaCapsule');
const MapDayGifts = require('../../../../Game/Item/MapDayGifts');
import { Logger } from '../../../../../shared/utils';

type Reward = { itemId: number; count: number };

class PacketReceiverCount extends BaseProto {
  constructor(private readonly count: number) { super(CommandID.TALK_COUNT); }
  public serialize(): Buffer {
    const body = Buffer.alloc(4);
    body.writeUInt32BE(this.count);
    return body;
  }
}

class PacketReceiverReward extends BaseProto {
  constructor(private readonly rewards: Reward[]) { super(CommandID.TALK_CATE); }
  public serialize(): Buffer {
    const body = Buffer.alloc(8 + this.rewards.length * 8);
    body.writeUInt32BE(this.rewards.length, 4);
    this.rewards.forEach((reward, index) => {
      body.writeUInt32BE(reward.itemId, 8 + index * 8);
      body.writeUInt32BE(reward.count, 12 + index * 8);
    });
    return body;
  }
}

@Opcode(CommandID.TALK_COUNT, InjectType.NONE)
export class TalkCountHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4) {
      await player.SendPacket(new PacketEmpty(CommandID.TALK_COUNT).setResult(5001));
      return;
    }
    const type = body.readUInt32BE(0);
    try {
      let count: number;
      if (type === 2001) count = await new SuperNonoCoins(player).Count();
      else if (type === 1004 || type === 2002) count = await new ExperienceReceiver(player).Count(type);
      else if (type === 1501 || type === 2101) count = await new SuperAnalyzer(player).Count(type);
      else if (type === 2051) count = await new GachaTicket(player).Count();
      else if (type === 1502) count = await new HelkaCapsule(player).Count();
      else if (type === 200014) count = await require('../../../../Game/Battle/ClosedSpaceXita').Count(player);
      else if (MapDayGifts.IsType(type)) count = await MapDayGifts.Count(player, session, type);
      else count = await new Mining(player).Count(type);
      if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;
      await player.SendPacket(new PacketReceiverCount(count));
    } catch {
      if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;
      await player.SendPacket(new PacketEmpty(CommandID.TALK_COUNT).setResult(5001));
    }
  }
}

@Opcode(CommandID.TALK_CATE, InjectType.NONE)
export class TalkCateHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4) {
      await player.SendPacket(new PacketEmpty(CommandID.TALK_CATE).setResult(5001));
      return;
    }
    const type = body.readUInt32BE(0);
    let rewards: Reward[];
    try {
      if (type === 1004 || type === 2002) {
        // The original receiver reads count only; id 0 is its existing placeholder.
        rewards = [{ itemId: 0, count: await new ExperienceReceiver(player).Claim(type) }];
      } else if (type === 2001) {
        rewards = [{ itemId: 1, count: await new SuperNonoCoins(player).Claim() }];
      } else if (type === 1501 || type === 2101) {
        rewards = [await new SuperAnalyzer(player).Claim(type)];
      } else if (type === 2051) {
        rewards = [await new GachaTicket(player).Claim()];
      } else if (type === 1502) {
        rewards = [await new HelkaCapsule(player).Claim()];
      } else if (MapDayGifts.IsType(type)) {
        rewards = [await MapDayGifts.Claim(player, session, type)];
      } else rewards = await new Mining(player).Claim(type);
    } catch (error) {
      if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;
      await player.SendPacket(new PacketEmpty(CommandID.TALK_CATE).setResult(
        error instanceof ReceiverAlreadyClaimed || error instanceof AnalyzerAlreadyClaimed ||
        error instanceof GachaTicketAlreadyClaimed || error instanceof HelkaCapsuleAlreadyClaimed ||
        error instanceof MapDayGifts.MapDayGiftLimit ? 5002 : 5000));
      return;
    }
    if (MapDayGifts.IsType(type) && (player.Session !== session || session.Socket.destroyed)) return;
    try {
      await player.SendPacket(new PacketReceiverReward(rewards));
    } catch (error) {
      Logger.Error('[TalkCate] Reward committed; response delivery failed',
        error instanceof Error ? error : new Error(String(error)));
    }
  }
}
