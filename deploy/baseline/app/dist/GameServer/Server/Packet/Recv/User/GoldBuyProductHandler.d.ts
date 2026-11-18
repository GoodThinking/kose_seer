import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 1104 GOLD_BUY_PRODUCT] 使用金豆购买商品
 */
export declare class GoldBuyProductHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GoldBuyProductHandler.d.ts.map