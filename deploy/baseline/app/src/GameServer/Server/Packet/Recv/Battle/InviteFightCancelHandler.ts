import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { InviteFightCancelReqProto } from '../../../../../shared/proto/packets/req/battle/InviteFightCancelReqProto';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { PacketInviteFightCancel } from '../../Send/Battle';
import { PvpBattleManager } from '../../../../Game/Battle/PvpBattleManager';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请
 */
@Opcode(CommandID.INVITE_FIGHT_CANCEL, InjectType.NONE)
export class InviteFightCancelHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    try {
      const req = InviteFightCancelReqProto.fromBuffer(body);

      const inviterId = player.Uid;
      const targetId = req.targetUserId;

      // 取消邀请
      const success = PvpBattleManager.Instance.CancelInvite(inviterId, targetId);

      if (!success) {
        await player.SendPacket(new PacketEmpty(CommandID.INVITE_FIGHT_CANCEL).setResult(5001));
        Logger.Warn(`[InviteFightCancelHandler] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
        return;
      }

      // 发送确认
      await player.SendPacket(new PacketInviteFightCancel());

      Logger.Info(`[InviteFightCancelHandler] 取消邀请: inviterId=${inviterId}, targetId=${targetId}`);
    } catch (error) {
      Logger.Error(`[InviteFightCancelHandler] Handle failed`, error as Error);
      await player.SendPacket(new PacketEmpty(CommandID.INVITE_FIGHT_CANCEL).setResult(5000));
    }
  }
}
