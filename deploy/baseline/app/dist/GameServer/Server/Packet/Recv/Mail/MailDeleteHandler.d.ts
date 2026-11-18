/**
 * [CMD: 2755 MAIL_DELETE] 删除邮件
 *
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */
import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
export declare class MailDeleteHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=MailDeleteHandler.d.ts.map