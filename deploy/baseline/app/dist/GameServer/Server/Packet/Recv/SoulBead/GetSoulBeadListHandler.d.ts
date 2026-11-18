import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * [CMD: 2354 GET_SOUL_BEAD_List] 获取魂珠列表
 * 暂时返回空列表
 */
export declare class GetSoulBeadListHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetSoulBeadListHandler.d.ts.map