/**
 * 邮件信息接口
 */
export interface IMailInfo {
    id: number;
    userId: number;
    senderId: number;
    senderNick: string;
    title: string;
    content: string;
    isRead: boolean;
    hasAttachment: boolean;
    attachmentType: number;
    attachmentId: number;
    attachmentCount: number;
    isClaimed: boolean;
    sendTime: number;
    expireTime: number;
    mailType: number;
}
/**
 * 创建默认邮件信息
 */
export declare function createDefaultMailInfo(userId: number, senderId: number): IMailInfo;
/**
 * 邮件附件类型枚举
 */
export declare enum MailAttachmentType {
    NONE = 0,// 无附件
    ITEM = 1,// 物品
    PET = 2,// 精灵
    COINS = 3
}
/**
 * 邮件类型枚举
 */
export declare enum MailType {
    NORMAL = 0,// 普通邮件
    SYSTEM = 1,// 系统邮件
    REWARD = 2
}
//# sourceMappingURL=MailModel.d.ts.map