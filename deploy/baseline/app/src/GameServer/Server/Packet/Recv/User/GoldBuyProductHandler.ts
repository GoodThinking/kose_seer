import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
import { Opcode, InjectType } from '../../../../../shared/decorators';
import { CommandID } from '../../../../../shared/protocol/CommandID';
import { GoldBuyProductReqProto } from '../../../../../shared/proto/packets/req/user/GoldBuyProductReqProto';
import { Logger } from '../../../../../shared/utils';

/**
 * [CMD: 1104 GOLD_BUY_PRODUCT] 使用金豆购买商品
 */
@Opcode(CommandID.GOLD_BUY_PRODUCT, InjectType.NONE)
export class GoldBuyProductHandler implements IHandler {
  public async Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void> {
    const player = session.Player;
    if (!player) return;

    const req = new GoldBuyProductReqProto();
    req.deserialize(body);

    Logger.Info(
      `[GoldBuyProductHandler] UserID=${player.Data.userID}, ProductId=${req.productId}, Count=${req.count}`
    );

    await player.ItemManager.HandleGoldBuyProduct(req.productId, req.count);
  }
}
