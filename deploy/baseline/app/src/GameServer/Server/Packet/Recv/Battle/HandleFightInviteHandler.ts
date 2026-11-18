import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { HandleFightInviteReqProto } from '../../../../../shared/proto/packets/req/battle/HandleFightInviteReqProto';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { PacketHandleFightInvite, PacketNoteHandleFightInvite } from '../../Send/Battle';
import { PvpBattleManager } from '../../../../Game/Battle/PvpBattleManager';
import { OnlineTracker } from '../../../../Game/Player/OnlineTracker';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请
 */
@Opcode(CommandID.HANDLE_FIGHT_INVITE, InjectType.NONE)
export class HandleFightInviteHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = HandleFightInviteReqProto.fromBuffer(body);

      const targetId = player.Uid;
      const inviterId = req.inviterUserId;
      const accept = req.accept === 1;

      // 处理邀请
      const invite = PvpBattleManager.Instance.HandleInvite(inviterId, targetId, accept);

      if (!invite) {
        await player.SendPacket(new PacketEmpty(CommandID.HANDLE_FIGHT_INVITE).setResult(5001));
        Logger.Warn(`[HandleFightInviteHandler] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
        return;
      }

      // 发送确认给目标玩家
      await player.SendPacket(new PacketHandleFightInvite());

      // 推送处理结果给邀请者
      // result: 0=拒绝, 1=接受
      await OnlineTracker.Instance.SendToPlayer(
        inviterId,
        new PacketNoteHandleFightInvite(targetId, invite.targetNick, accept ? 1 : 0)
      );

      Logger.Info(
        `[HandleFightInviteHandler] 处理邀请: inviterId=${inviterId}, targetId=${targetId}, ` +
        `accept=${accept}`
      );

      // 如果拒绝邀请，直接返回
      if (!accept) {
        return;
      }

      // 如果接受邀请，创建PVP战斗房间并发送准备通知
      // 创建战斗房间
      const roomKey = PvpBattleManager.Instance.CreateBattleRoom(inviterId, targetId);
      
      // 获取双方玩家实例
      const inviterSession = OnlineTracker.Instance.GetPlayerSession(inviterId);
      const targetSession = OnlineTracker.Instance.GetPlayerSession(targetId);
      
      if (!inviterSession?.Player || !targetSession?.Player) {
        Logger.Error(`[HandleFightInviteHandler] 无法获取玩家实例`);
        return;
      }

      // 发送 NOTE_READY_TO_FIGHT 给双方
      const { PacketNoteReadyToFight } = await import('../../Send/Battle');
      
      // 构建双方精灵信息
      const inviterPets = inviterSession.Player.BattleManager['BuildPlayerPetsInfo']();
      const targetPets = targetSession.Player.BattleManager['BuildPlayerPetsInfo']();
      
      // 发送给邀请者
      await inviterSession.Player.SendPacket(
        new PacketNoteReadyToFight(
          inviterId,
          invite.inviterNick,
          inviterPets,
          targetId,
          invite.targetNick,
          targetPets
        )
      );
      
      // 发送给被邀请者
      await targetSession.Player.SendPacket(
        new PacketNoteReadyToFight(
          targetId,
          invite.targetNick,
          targetPets,
          inviterId,
          invite.inviterNick,
          inviterPets
        )
      );
      
      Logger.Info(
        `[HandleFightInviteHandler] PVP战斗房间已创建: roomKey=${roomKey}, ` +
        `player1=${inviterId}, player2=${targetId}`
      );
    } catch (error) {
      Logger.Error(`[HandleFightInviteHandler] Handle failed`, error as Error);
      await player.SendPacket(new PacketEmpty(CommandID.HANDLE_FIGHT_INVITE).setResult(5000));
    }
  }
}
