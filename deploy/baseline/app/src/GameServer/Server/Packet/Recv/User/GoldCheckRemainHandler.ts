import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGoldCheckRemain } from '../../Send/User/PacketGoldCheckRemain';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 1105 GOLD_CHECK_REMAIN] 查询赛尔豆余额
 */
@Opcode(CommandID.GOLD_CHECK_REMAIN, InjectType.NONE)
export class GoldCheckRemainHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const coins = player.Data.coins;
    
    await player.SendPacket(new PacketGoldCheckRemain(coins));
    
    Logger.Info(`[GoldCheckRemainHandler] 查询赛尔豆余额: UserID=${player.Data.userID}, Coins=${coins}`);
  }
}
