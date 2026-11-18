import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * 接受任务处理器
 * CMD 2201: ACCEPT_TASK
 */
export declare class AcceptTaskHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=AcceptTaskHandler.d.ts.map