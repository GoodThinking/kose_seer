"use strict";
/**
 * [CMD: 2755 MAIL_DELETE] 删除邮件响应
 *
 * 响应格式:
 * - success: uint32 (是否成功)
 * - mailId: uint32 (邮件ID)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailDeleteRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
class MailDeleteRspProto extends BaseProto_1.BaseProto {
    success = false;
    mailId = 0;
    constructor() {
        super(CommandID_1.CommandID.MAIL_DELETE);
    }
    serialize() {
        const buffer = Buffer.alloc(8);
        buffer.writeUInt32BE(this.success ? 1 : 0, 0);
        buffer.writeUInt32BE(this.mailId, 4);
        return buffer;
    }
}
exports.MailDeleteRspProto = MailDeleteRspProto;
//# sourceMappingURL=MailDeleteRspProto.js.map