"use strict";
/**
 * 邮件数据类
 * 直接映射数据库表，提供静态方法便捷访问
 *
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailData = void 0;
const DatabaseHelper_1 = require("../DatabaseHelper");
const Logger_1 = require("../../shared/utils/Logger");
const BaseData_1 = require("./BaseData");
/**
 * 邮件数据（对应数据库表 mails）
 *
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetMailDataByUid 便捷访问
 */
class MailData extends BaseData_1.BaseData {
    /** 用户ID（主键） */
    Uid;
    /** 邮件列表 */
    MailList = [];
    constructor(uid) {
        // 调用父类构造函数
        super(uid, [], // 额外的黑名单字段
        ['MailList'] // 需要深度 Proxy 的数组字段
        );
        this.Uid = uid;
        // 返回 Proxy 包装的对象，实现自动保存
        return this.createProxy(this);
    }
    /**
     * 立即保存到数据库
     */
    async save() {
        try {
            await DatabaseHelper_1.DatabaseHelper.Instance.SaveMailData(this);
            Logger_1.Logger.Debug(`[MailData] 自动保存成功: uid=${this.Uid}`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[MailData] 自动保存失败: uid=${this.Uid}`, error);
        }
    }
    /**
     * 从数据库行创建 MailData
     */
    static FromRow(row) {
        const data = new MailData(row.owner_id);
        data.MailList = row.mail_list ? JSON.parse(row.mail_list) : [];
        return data;
    }
    /**
     * 转换为数据库行
     */
    ToRow() {
        return {
            owner_id: this.Uid,
            mail_list: JSON.stringify(this.MailList)
        };
    }
    /**
     * 静态方法：根据 UID 获取邮件数据
     */
    static async GetMailDataByUid(uid) {
        const data = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_MailData(uid);
        return data;
    }
    /**
     * 添加邮件
     */
    AddMail(mail) {
        this.MailList.push(mail);
        // 自动触发保存（通过深度 Proxy）
    }
    /**
     * 删除邮件
     */
    DeleteMail(mailId) {
        const index = this.MailList.findIndex(m => m.id === mailId);
        if (index === -1)
            return false;
        this.MailList.splice(index, 1);
        // 自动触发保存（通过深度 Proxy）
        return true;
    }
    /**
     * 获取邮件
     */
    GetMail(mailId) {
        return this.MailList.find(m => m.id === mailId) || null;
    }
    /**
     * 获取未读邮件
     */
    GetUnreadMails() {
        return this.MailList.filter(m => !m.isRead);
    }
    /**
     * 获取未读邮件数量
     */
    GetUnreadCount() {
        return this.MailList.filter(m => !m.isRead).length;
    }
    /**
     * 标记邮件为已读
     */
    MarkAsRead(mailId) {
        const mail = this.GetMail(mailId);
        if (!mail)
            return false;
        mail.isRead = true;
        // 自动触发保存（通过深度 Proxy）
        return true;
    }
    /**
     * 标记所有邮件为已读
     */
    MarkAllAsRead() {
        this.MailList.forEach(m => m.isRead = true);
        // 自动触发保存（通过深度 Proxy）
    }
    /**
     * 领取附件
     */
    ClaimAttachment(mailId) {
        const mail = this.GetMail(mailId);
        if (!mail || !mail.hasAttachment || mail.isClaimed)
            return false;
        mail.isClaimed = true;
        // 自动触发保存（通过深度 Proxy）
        return true;
    }
    /**
     * 删除所有已读邮件
     */
    DeleteAllRead() {
        const beforeCount = this.MailList.length;
        this.MailList = this.MailList.filter(m => !m.isRead || (m.hasAttachment && !m.isClaimed));
        // 自动触发保存（通过深度 Proxy）
        return beforeCount - this.MailList.length;
    }
}
exports.MailData = MailData;
//# sourceMappingURL=MailData.js.map