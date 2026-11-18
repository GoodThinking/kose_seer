import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 移除黑名单处理器
 * CMD 2155
 */
export declare class BlackRemoveHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=BlackRemoveHandler.d.ts.map