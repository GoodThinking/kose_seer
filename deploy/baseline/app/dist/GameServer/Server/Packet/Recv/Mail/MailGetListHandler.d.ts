/**
 * [CMD: 2751 MAIL_GET_LIST] 获取邮件列表
 *
 * 移植自: luvit/luvit_version/handlers/mail_handlers.lua
 */
import { IClientSession, IHandler } from '../../IHandler';
import { HeadInfo } from '../../../../../shared/protocol';
export declare class MailGetListHandler implements IHandler {
    Handle(session: IClientSession, head: HeadInfo, body: Buffer): Promise<void>;
}
//# sourceMappingURL=MailGetListHandler.d.ts.map