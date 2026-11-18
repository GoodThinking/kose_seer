/**
 * [CMD: 2754 MAIL_SET_READED] 标记邮件为已读响应
 *
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mailId: uint32 (邮件ID，0表示全部)
 */
import { BaseProto } from '../../../base/BaseProto';
export declare class MailSetReadedRspProto extends BaseProto {
    success: boolean;
    mailId: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=MailSetReadedRspProto.d.ts.map