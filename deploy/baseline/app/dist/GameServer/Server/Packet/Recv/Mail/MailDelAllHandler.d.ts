/**
 * [CMD: 2756 MAIL_DEL_ALL] 删除所有已读邮件
 *
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */
import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
export declare class MailDelAllHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=MailDelAllHandler.d.ts.map