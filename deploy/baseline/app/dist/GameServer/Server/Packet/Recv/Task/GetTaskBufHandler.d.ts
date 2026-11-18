import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * 获取任务缓存处理器
 * CMD 2203: GET_TASK_BUF
 */
export declare class GetTaskBufHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetTaskBufHandler.d.ts.map