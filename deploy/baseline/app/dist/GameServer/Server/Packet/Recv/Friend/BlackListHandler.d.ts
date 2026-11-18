import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 获取黑名单列表处理器
 * CMD 2159
 */
export declare class BlackListHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=BlackListHandler.d.ts.map