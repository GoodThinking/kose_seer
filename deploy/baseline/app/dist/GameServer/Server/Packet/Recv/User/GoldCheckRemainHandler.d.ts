import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 1105 GOLD_CHECK_REMAIN] 查询赛尔豆余额
 */
export declare class GoldCheckRemainHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GoldCheckRemainHandler.d.ts.map