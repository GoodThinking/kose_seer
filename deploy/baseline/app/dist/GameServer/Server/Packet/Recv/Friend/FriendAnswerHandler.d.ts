import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 好友请求回复处理器
 * CMD 2152
 */
export declare class FriendAnswerHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=FriendAnswerHandler.d.ts.map