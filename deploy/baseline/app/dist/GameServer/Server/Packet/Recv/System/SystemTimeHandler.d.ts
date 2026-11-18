import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 1002 SYSTEM_TIME] 获取系统时间
 * 简单逻辑，直接在 Handler 中处理
 */
export declare class SystemTimeHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=SystemTimeHandler.d.ts.map