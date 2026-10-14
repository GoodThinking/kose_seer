import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGoldCheckRemain } from '../../Send/User/PacketGoldCheckRemain';
import { Logger } from '../../../../../shared/utils';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { GoldToWire } from '../../../../../shared/protocol/GoldCurrency';

/**
 * [CMD: 1105 GOLD_CHECK_REMAIN] 查询金豆余额
 */
@Opcode(CommandID.GOLD_CHECK_REMAIN, InjectType.NONE)
export class GoldCheckRemainHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const gold = player.Data.gold;
    try { GoldToWire(gold); } catch {
      await player.SendPacket(new PacketEmpty(CommandID.GOLD_CHECK_REMAIN).setResult(5000));
      return;
    }
    
    await player.SendPacket(new PacketGoldCheckRemain(gold));
    
    Logger.Info(`[GoldCheckRemainHandler] 查询金豆余额: UserID=${player.Data.userID}, Gold=${gold}`);
  }
}
