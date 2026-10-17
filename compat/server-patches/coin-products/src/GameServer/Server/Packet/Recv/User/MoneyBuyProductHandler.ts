import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { BuyCoinProduct, CoinProductError } from '../../../../Game/Item/CoinProductPurchase';
import { PacketMoneyBuyProduct } from '../../Send/User/PacketMoneyBuyProduct';
import { PacketEmpty } from '../../Send/PacketEmpty';
import { Logger } from '../../../../../shared/utils';

@Opcode(CommandID.MONEY_BUY_PRODUCT, InjectType.NONE)
export class MoneyBuyProductHandler implements IHandler {
  public async Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 6) {
      await player.SendPacket(new PacketEmpty(CommandID.MONEY_BUY_PRODUCT).setResult(5001));
      return;
    }
    let committed = false;
    try {
      const receipt = await BuyCoinProduct(player, body.readUInt32BE(0), body.readUInt16BE(4));
      committed = true;
      await player.SendPacket(new PacketMoneyBuyProduct(receipt.spentCoins, receipt.coins));
    } catch (error) {
      Logger.Error(committed ? '[CoinProduct] Purchase committed; notification failed' : '[CoinProduct] Purchase failed', error instanceof Error ? error : new Error(String(error)));
      if (!committed) await player.SendPacket(new PacketEmpty(CommandID.MONEY_BUY_PRODUCT).setResult(error instanceof CoinProductError ? error.code : 5000));
    }
  }
}
