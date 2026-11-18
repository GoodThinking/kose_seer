import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * 获取每日任务缓存处理器
 * CMD 2234: GET_DAILY_TASK_BUF
 */
export declare class GetDailyTaskBufHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=GetDailyTaskBufHandler.d.ts.map