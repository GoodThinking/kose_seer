import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GetRewardBoostStatus, UseRewardBoost, RewardBoostError } from '../../../../Game/Reward/RewardBoost';
import { PacketRewardBoost } from '../../Send/Item/PacketRewardBoost';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.REWARD_BOOST_USE, InjectType.NONE)
export class RewardBoostUseHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4) {
      await player.SendPacket(new PacketEmpty(CommandID.REWARD_BOOST_USE).setResult(5001));
      return;
    }
    try {
      const result = await UseRewardBoost(player, body.readUInt32BE(0));
      await player.SendPacket(new PacketRewardBoost(CommandID.REWARD_BOOST_USE,
        [result.itemId, result.remainingCount, result.expiresAt, result.now]));
    } catch (error) {
      Logger.Error('[RewardBoost] Item use failed', error instanceof Error ? error : new Error(String(error)));
      await player.SendPacket(new PacketEmpty(CommandID.REWARD_BOOST_USE).setResult(error instanceof RewardBoostError ? error.code : 5000));
    }
  }
}

@Opcode(CommandID.REWARD_BOOST_STATUS, InjectType.NONE)
export class RewardBoostStatusHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 0) {
      await player.SendPacket(new PacketEmpty(CommandID.REWARD_BOOST_STATUS).setResult(5001));
      return;
    }
    try {
      const status = await GetRewardBoostStatus(player.Uid);
      await player.SendPacket(new PacketRewardBoost(CommandID.REWARD_BOOST_STATUS,
        [status.now, status.experience.expiresAt, status.learning.expiresAt, status.coins.expiresAt]));
    } catch (error) {
      Logger.Error('[RewardBoost] Status query failed', error instanceof Error ? error : new Error(String(error)));
      await player.SendPacket(new PacketEmpty(CommandID.REWARD_BOOST_STATUS).setResult(5000));
    }
  }
}
