import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 异色配置请求处理器
 * CMD 109001
 */
export declare class ShinyConfigHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=ShinyConfigHandler.d.ts.map