import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * [CMD: 70001 GET_EXCHANGE_INFO] 获取兑换信息
 * 返回荣誉值
 */
export declare class GetExchangeInfoHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetExchangeInfoHandler.d.ts.map