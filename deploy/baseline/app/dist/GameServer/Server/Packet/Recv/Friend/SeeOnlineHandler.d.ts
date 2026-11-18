import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 查看在线状态处理器
 * CMD 2157
 */
export declare class SeeOnlineHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=SeeOnlineHandler.d.ts.map