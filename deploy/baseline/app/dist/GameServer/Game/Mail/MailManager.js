"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailManager = void 0;
const BaseManager_1 = require("../Base/BaseManager");
const utils_1 = require("../../../shared/utils");
const Mail_1 = require("../../Server/Packet/Send/Mail");
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
class MailManager extends BaseManager_1.BaseManager {
    MailData;
    constructor(player) {
        super(player);
    }
    async Initialize() {
        this.MailData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_MailData(this.UserID);
        utils_1.Logger.Debug(`[MailManager] 初始化完�? UserID=${this.UserID}, Mails=${this.MailData.MailList.length}`);
    }
    async HandleGetMailList() {
        const mails = this.MailData.MailList.slice(0, 100);
        await this.Player.SendPacket(new Mail_1.PacketMailGetList(this.MailData.MailList.length, mails));
    }
    async HandleGetUnreadCount() {
        const count = this.MailData.GetUnreadCount();
        await this.Player.SendPacket(new Mail_1.PacketMailGetUnread(count));
    }
    async HandleReadMail(mailId) {
        const mail = this.MailData.GetMail(mailId);
        if (mail && !mail.isRead) {
            this.MailData.MarkAsRead(mailId);
            await DatabaseHelper_1.DatabaseHelper.Instance.SaveMailData(this.MailData);
        }
        await this.Player.SendPacket(new Mail_1.PacketMailGetContent(mail));
    }
    async HandleMarkAsRead(mailId) {
        let success = false;
        if (mailId === 0) {
            this.MailData.MarkAllAsRead();
            await DatabaseHelper_1.DatabaseHelper.Instance.SaveMailData(this.MailData);
            success = true;
        }
        else {
            success = this.MailData.MarkAsRead(mailId);
            if (success) {
                await DatabaseHelper_1.DatabaseHelper.Instance.SaveMailData(this.MailData);
            }
        }
        await this.Player.SendPacket(new Mail_1.PacketMailSetReaded(success, mailId));
    }
    async HandleDeleteMail(mailId) {
        const mail = this.MailData.GetMail(mailId);
        const success = mail && !(mail.hasAttachment && !mail.isClaimed) ? this.MailData.DeleteMail(mailId) : false;
        if (success) {
            await DatabaseHelper_1.DatabaseHelper.Instance.SaveMailData(this.MailData);
        }
        await this.Player.SendPacket(new Mail_1.PacketMailDelete(success, mailId));
    }
    async HandleDeleteAllRead() {
        const count = this.MailData.DeleteAllRead();
        await DatabaseHelper_1.DatabaseHelper.Instance.SaveMailData(this.MailData);
        await this.Player.SendPacket(new Mail_1.PacketMailDelAll(count));
    }
}
exports.MailManager = MailManager;
//# sourceMappingURL=MailManager.js.map