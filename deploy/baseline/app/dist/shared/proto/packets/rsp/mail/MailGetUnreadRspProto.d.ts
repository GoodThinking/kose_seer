/**
 * [CMD: 2757 MAIL_GET_UNREAD] 获取未读邮件数量响应
 *
 * 响应格式:
 * - count: uint32 (未读邮件数量)
 */
import { BaseProto } from '../../../base/BaseProto';
export declare class MailGetUnreadRspProto extends BaseProto {
    count: number;
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=MailGetUnreadRspProto.d.ts.map