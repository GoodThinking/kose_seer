import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请
 */
export declare class HandleFightInviteHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=HandleFightInviteHandler.d.ts.map