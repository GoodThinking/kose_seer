/**
 * [CMD: 2753 MAIL_GET_CONTENT] 读取邮件内容
 *
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */
import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
export declare class MailGetContentHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=MailGetContentHandler.d.ts.map