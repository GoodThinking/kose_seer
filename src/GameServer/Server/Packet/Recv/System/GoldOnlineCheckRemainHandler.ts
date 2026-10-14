import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { PacketGoldOnlineCheckRemain } from '../../Send/System/PacketGoldOnlineCheckRemain';
import { PacketEmpty } from '../../Send/PacketEmpty';

/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金豆余额
 * 
 * 请求：无参数
 * 响应：gold×100；KOSE 追加 coins 原单位（8 bytes），XIN 不追加（4 bytes）
 */
@Opcode(CommandID.GOLD_ONLINE_CHECK_REMAIN, InjectType.NONE)
export class GoldOnlineCheckRemainHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    // Stored whole beans are encoded as hundredths by the response packet.
    const gold = player.Data.gold;
    let response: PacketGoldOnlineCheckRemain;
    try { response = new PacketGoldOnlineCheckRemain(gold, player.Data.coins); } catch {
      await player.SendPacket(new PacketEmpty(CommandID.GOLD_ONLINE_CHECK_REMAIN).setResult(5000));
      return;
    }

    // 发送响应
    await player.SendPacket(response);
  }
}
