import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * 完成任务处理器
 * CMD 2202: COMPLETE_TASK
 */
export declare class CompleteTaskHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=CompleteTaskHandler.d.ts.map