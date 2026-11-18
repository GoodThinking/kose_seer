import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家
 * 简单逻辑：设置 NoNo 的跟随状态（会话级别）
 */
export declare class NoNoFollowOrHoomHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=NoNoFollowOrHoomHandler.d.ts.map