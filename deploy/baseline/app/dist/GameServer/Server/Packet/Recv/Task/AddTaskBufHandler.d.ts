import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * 添加/更新任务缓存处理器
 * CMD 2204: ADD_TASK_BUF
 */
export declare class AddTaskBufHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=AddTaskBufHandler.d.ts.map