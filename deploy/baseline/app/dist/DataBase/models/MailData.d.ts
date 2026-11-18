/**
 * 邮件数据类
 * 直接映射数据库表，提供静态方法便捷访问
 *
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */
import { IMailInfo } from '../../shared/models/MailModel';
import { BaseData } from './BaseData';
/**
 * 邮件数据（对应数据库表 mails）
 *
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - 提供静态方法 GetMailDataByUid 便捷访问
 */
export declare class MailData extends BaseData {
    /** 用户ID（主键） */
    Uid: number;
    /** 邮件列表 */
    MailList: IMailInfo[];
    constructor(uid: number);
    /**
     * 立即保存到数据库
     */
    save(): Promise<void>;
    /**
     * 从数据库行创建 MailData
     */
    static FromRow(row: any): MailData;
    /**
     * 转换为数据库行
     */
    ToRow(): any;
    /**
     * 静态方法：根据 UID 获取邮件数据
     */
    static GetMailDataByUid(uid: number): Promise<MailData | null>;
    /**
     * 添加邮件
     */
    AddMail(mail: IMailInfo): void;
    /**
     * 删除邮件
     */
    DeleteMail(mailId: number): boolean;
    /**
     * 获取邮件
     */
    GetMail(mailId: number): IMailInfo | null;
    /**
     * 获取未读邮件
     */
    GetUnreadMails(): IMailInfo[];
    /**
     * 获取未读邮件数量
     */
    GetUnreadCount(): number;
    /**
     * 标记邮件为已读
     */
    MarkAsRead(mailId: number): boolean;
    /**
     * 标记所有邮件为已读
     */
    MarkAllAsRead(): void;
    /**
     * 领取附件
     */
    ClaimAttachment(mailId: number): boolean;
    /**
     * 删除所有已读邮件
     */
    DeleteAllRead(): number;
}
//# sourceMappingURL=MailData.d.ts.map