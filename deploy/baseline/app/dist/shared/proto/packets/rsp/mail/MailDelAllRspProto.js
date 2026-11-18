"use strict";
/**
 * [CMD: 2756 MAIL_DEL_ALL] 删除所有已读邮件响应
 *
 * 响应格式:
 * - count: uint32 (删除的邮件数量)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailDelAllRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
class MailDelAllRspProto extends BaseProto_1.BaseProto {
    count = 0;
    constructor() {
        super(CommandID_1.CommandID.MAIL_DEL_ALL);
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.count, 0);
        return buffer;
    }
}
exports.MailDelAllRspProto = MailDelAllRspProto;
//# sourceMappingURL=MailDelAllRspProto.js.map