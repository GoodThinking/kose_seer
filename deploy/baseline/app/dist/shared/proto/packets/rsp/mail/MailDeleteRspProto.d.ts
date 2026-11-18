/**
 * [CMD: 2755 MAIL_DELETE] 删除邮件响应
 *
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mailId: uint32 (邮件ID)
 */
import { BaseProto } from '../../../base/BaseProto';
export declare class MailDeleteRspProto extends BaseProto {
    success: boolean;
    mailId: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=MailDeleteRspProto.d.ts.map