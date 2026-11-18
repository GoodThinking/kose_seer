import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 1106 GOLD_ONLINE_CHECK_REMAIN] 检查金币余额
 *
 * 请求：无参数
 * 响应：gold (4 bytes)
 */
export declare class GoldOnlineCheckRemainHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=GoldOnlineCheckRemainHandler.d.ts.map