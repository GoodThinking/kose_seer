import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * 接受每日任务处理器
 * CMD 2231: ACCEPT_DAILY_TASK
 *
 * Lua端实现：emptyResponse(2231, 4)
 * 逻辑：接受每日任务，保存到用户数据，返回空响应
 */
export declare class AcceptDailyTaskHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=AcceptDailyTaskHandler.d.ts.map