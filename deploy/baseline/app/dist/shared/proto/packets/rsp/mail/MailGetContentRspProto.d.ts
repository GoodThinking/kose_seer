/**
 * [CMD: 2753 MAIL_GET_CONTENT] 读取邮件内容响应
 *
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mail: MailInfo (邮件详细信息)
 *
 * MailInfo:
 * - id: uint32 (邮件ID)
 * - senderId: uint32 (发件人ID)
 * - senderNick: string[16] (发件人昵称)
 * - title: string[32] (邮件标题)
 * - content: string[256] (邮件内容)
 * - isRead: uint32 (是否已读)
 * - hasAttachment: uint32 (是否有附件)
 * - attachmentType: uint32 (附件类型)
 * - attachmentId: uint32 (附件ID)
 * - attachmentCount: uint32 (附件数量)
 * - isClaimed: uint32 (是否已领取)
 * - sendTime: uint32 (发送时间)
 * - expireTime: uint32 (过期时间)
 * - mailType: uint32 (邮件类型)
 */
import { BaseProto } from '../../../base/BaseProto';
import { IMailInfo } from '../../../../models/MailModel';
export declare class MailGetContentRspProto extends BaseProto {
    success: boolean;
    mail: IMailInfo | null;
    constructor();
    serialize(): Buffer;
    /**
     * 序列化邮件详细信息
     */
    private serializeMailInfo;
}
//# sourceMappingURL=MailGetContentRspProto.d.ts.map