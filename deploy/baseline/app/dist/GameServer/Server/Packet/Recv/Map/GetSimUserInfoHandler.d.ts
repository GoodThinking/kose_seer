import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 获取简单用户信息处理器
 * CMD 1005
 */
export declare class GetSimUserInfoHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetSimUserInfoHandler.d.ts.map