import { IHandler, IClientSession } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol/HeadInfo';
/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请
 */
export declare class InviteFightCancelHandler implements IHandler {
    Handle(session: IClientSession, _head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=InviteFightCancelHandler.d.ts.map