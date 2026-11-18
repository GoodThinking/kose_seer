/**
 * [CMD: 2751 MAIL_GET_LIST] 获取邮件列表响应
 *
 * 响应格式:
 * - total: uint32 (总邮件数)
 * - count: uint32 (当前返回的邮件数)
 * - mails: SingleMailInfo[] (邮件列表)
 *
 * SingleMailInfo:
 * - id: uint32 (邮件ID)
 * - senderId: uint32 (发件人ID)
 * - senderNick: string[16] (发件人昵称)
 * - title: string[32] (邮件标题)
 * - isRead: uint32 (是否已读)
 * - hasAttachment: uint32 (是否有附件)
 * - sendTime: uint32 (发送时间)
 * - mailType: uint32 (邮件类型)
 */
import { BaseProto } from '../../../base/BaseProto';
import { IMailInfo } from '../../../../models/MailModel';
export declare class MailGetListRspProto extends BaseProto {
    total: number;
    count: number;
    mails: IMailInfo[];
    constructor();
    serialize(): Buffer;
    /**
     * 序列化单个邮件信息
     *
     * 客户端期望的格式 (SingleMailInfo.as):
     * - id: uint32 (邮件ID)
     * - template: uint32 (邮件模板ID)
     * - time: uint32 (发送时间)
     * - fromID: uint32 (发件人ID)
     * - fromNick: string[16] (发件人昵称)
     * - flag: uint32 (是否已读: 0=未读, 1=已读)
     */
    private serializeSingleMail;
}
//# sourceMappingURL=MailGetListRspProto.d.ts.map