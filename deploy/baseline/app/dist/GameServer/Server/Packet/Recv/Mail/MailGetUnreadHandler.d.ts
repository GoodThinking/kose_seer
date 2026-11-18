/**
 * [CMD: 2757 MAIL_GET_UNREAD] 获取未读邮件数量
 *
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */
import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
export declare class MailGetUnreadHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=MailGetUnreadHandler.d.ts.map