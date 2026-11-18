import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
/**
 * 获取好友列表处理器
 * CMD 2158
 *
 * 请求格式: 无参数
 */
export declare class FriendListHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, _body: Buffer): Promise<void>;
}
//# sourceMappingURL=FriendListHandler.d.ts.map