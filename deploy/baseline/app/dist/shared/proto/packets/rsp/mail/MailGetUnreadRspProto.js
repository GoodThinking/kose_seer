"use strict";
/**
 * [CMD: 2757 MAIL_GET_UNREAD] 获取未读邮件数量响应
 *
 * 响应格式:
 * - count: uint32 (未读邮件数量)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailGetUnreadRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
class MailGetUnreadRspProto extends BaseProto_1.BaseProto {
    count = 0;
    constructor() {
        super(CommandID_1.CommandID.MAIL_GET_UNREAD);
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.count, 0);
        return buffer;
    }
}
exports.MailGetUnreadRspProto = MailGetUnreadRspProto;
//# sourceMappingURL=MailGetUnreadRspProto.js.map