import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * [CMD: 2052] 获取更多用户信息
 */
export declare class GetMoreUserInfoHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetMoreUserInfoHandler.d.ts.map