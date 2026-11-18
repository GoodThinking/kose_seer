"use strict";
/**
 * [CMD: 2754 MAIL_SET_READED] 标记邮件为已读响应
 *
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mailId: uint32 (邮件ID，0表示全部)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailSetReadedRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
class MailSetReadedRspProto extends BaseProto_1.BaseProto {
    success = false;
    mailId = 0;
    constructor() {
        super(CommandID_1.CommandID.MAIL_SET_READED);
    }
    serialize() {
        const buffer = Buffer.alloc(8);
        buffer.writeUInt32BE(this.success ? 1 : 0, 0);
        buffer.writeUInt32BE(this.mailId, 4);
        return buffer;
    }
}
exports.MailSetReadedRspProto = MailSetReadedRspProto;
//# sourceMappingURL=MailSetReadedRspProto.js.map