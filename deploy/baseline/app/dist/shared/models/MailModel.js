"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailType = exports.MailAttachmentType = void 0;
exports.createDefaultMailInfo = createDefaultMailInfo;
/**
 * 创建默认邮件信息
 */
function createDefaultMailInfo(userId, senderId) {
    const now = Math.floor(Date.now() / 1000);
    return {
        id: 0,
        userId,
        senderId,
        senderNick: '',
        title: '',
        content: '',
        isRead: false,
        hasAttachment: false,
        attachmentType: 0,
        attachmentId: 0,
        attachmentCount: 0,
        isClaimed: false,
        sendTime: now,
        expireTime: 0,
        mailType: 0
    };
}
/**
 * 邮件附件类型枚举
 */
var MailAttachmentType;
(function (MailAttachmentType) {
    MailAttachmentType[MailAttachmentType["NONE"] = 0] = "NONE";
    MailAttachmentType[MailAttachmentType["ITEM"] = 1] = "ITEM";
    MailAttachmentType[MailAttachmentType["PET"] = 2] = "PET";
    MailAttachmentType[MailAttachmentType["COINS"] = 3] = "COINS"; // 金币
})(MailAttachmentType || (exports.MailAttachmentType = MailAttachmentType = {}));
/**
 * 邮件类型枚举
 */
var MailType;
(function (MailType) {
    MailType[MailType["NORMAL"] = 0] = "NORMAL";
    MailType[MailType["SYSTEM"] = 1] = "SYSTEM";
    MailType[MailType["REWARD"] = 2] = "REWARD"; // 奖励邮件
})(MailType || (exports.MailType = MailType = {}));
//# sourceMappingURL=MailModel.js.map