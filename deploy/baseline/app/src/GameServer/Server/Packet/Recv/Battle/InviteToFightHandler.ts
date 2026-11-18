import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { InviteToFightReqProto } from '../../../../../shared/proto/packets/req/battle/InviteToFightReqProto';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { PacketInviteToFight, PacketNoteHandleFightInvite, PacketNoteInviteToFight } from '../../Send/Battle';
import { PvpBattleManager } from '../../../../Game/Battle/PvpBattleManager';
import { OnlineTracker } from '../../../../Game/Player/OnlineTracker';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战
 */
@Opcode(CommandID.INVITE_TO_FIGHT, InjectType.NONE)
export class InviteToFightHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = InviteToFightReqProto.fromBuffer(body);

      const targetId = req.targetUserId;
      const mode = req.mode; // 对战模式：1=单挑，2=多精灵
      const inviterId = player.Uid;
      const inviterNick = player.Data.nick || `Player${inviterId}`;

      // 验证目标玩家
      if (targetId === inviterId) {
        await player.SendPacket(new PacketEmpty(CommandID.INVITE_TO_FIGHT).setResult(5001));
        Logger.Warn(`[InviteToFightHandler] 不能邀请自己: userId=${inviterId}`);
        return;
      }

      // 检查目标玩家是否在线
      if (!OnlineTracker.Instance.IsOnline(targetId)) {
        // 发送成功确认给邀请者
        await player.SendPacket(new PacketInviteToFight());
        
        // 发送通知：对方不在线 (result=4)
        await player.SendPacket(new PacketNoteHandleFightInvite(targetId, '', 4));
        
        Logger.Warn(`[InviteToFightHandler] 目标玩家不在线: targetId=${targetId}`);
        return;
      }

      // 获取目标玩家信息
      const targetSession = OnlineTracker.Instance.GetPlayerSession(targetId);
      if (!targetSession?.Player) {
        // 发送成功确认给邀请者
        await player.SendPacket(new PacketInviteToFight());
        
        // 发送通知：对方不在线 (result=4)
        await player.SendPacket(new PacketNoteHandleFightInvite(targetId, '', 4));
        
        Logger.Warn(`[InviteToFightHandler] 无法获取目标玩家: targetId=${targetId}`);
        return;
      }

      const targetNick = targetSession.Player.Data.nick || `Player${targetId}`;

      // 检查邀请者是否有健康的精灵
      const inviterPets = player.PetManager.GetPetsInBag();
      const inviterHealthyPets = inviterPets.filter((p: any) => p.hp > 0);
      if (inviterHealthyPets.length === 0) {
        await player.SendPacket(new PacketEmpty(CommandID.INVITE_TO_FIGHT).setResult(10017));
        Logger.Warn(`[InviteToFightHandler] 邀请者没有健康精灵: userId=${inviterId}`);
        return;
      }

      // 检查目标玩家是否有健康的精灵
      const targetPets = targetSession.Player.PetManager.GetPetsInBag();
      const targetHealthyPets = targetPets.filter((p: any) => p.hp > 0);
      if (targetHealthyPets.length === 0) {
        // 发送成功确认给邀请者
        await player.SendPacket(new PacketInviteToFight());
        
        // 发送通知：对方没有可出战的精灵 (result=3)
        const notifyPacket = new PacketNoteHandleFightInvite(targetId, targetNick, 3);
        await player.SendPacket(notifyPacket);
        
        Logger.Warn(
          `[InviteToFightHandler] 目标玩家没有健康精灵: targetId=${targetId}, ` +
          `targetNick=${targetNick}, 发送result=3`
        );
        return;
      }

      // 创建邀请
      const success = PvpBattleManager.Instance.CreateInvite(
        inviterId,
        inviterNick,
        targetId,
        targetNick
      );

      if (!success) {
        await player.SendPacket(new PacketEmpty(CommandID.INVITE_TO_FIGHT).setResult(5004));
        Logger.Warn(`[InviteToFightHandler] 创建邀请失败: inviterId=${inviterId}, targetId=${targetId}`);
        return;
      }

      // 发送确认给邀请者
      await player.SendPacket(new PacketInviteToFight());

      // 推送邀请通知给目标玩家
      await OnlineTracker.Instance.SendToPlayer(
        targetId,
        new PacketNoteInviteToFight(inviterId, inviterNick, mode)
      );

      Logger.Info(
        `[InviteToFightHandler] 邀请对战: inviterId=${inviterId}, inviterNick=${inviterNick}, ` +
        `targetId=${targetId}, targetNick=${targetNick}, mode=${mode}`
      );
    } catch (error) {
      Logger.Error(`[InviteToFightHandler] Handle failed`, error as Error);
      await player.SendPacket(new PacketEmpty(CommandID.INVITE_TO_FIGHT).setResult(5000));
    }
  }
}
