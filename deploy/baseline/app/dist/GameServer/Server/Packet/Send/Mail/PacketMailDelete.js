"use strict";
/**
 * 删除邮件响应包
 * CMD 2755
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMailDelete = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MailDeleteRspProto_1 = require("../../../../../shared/proto/packets/rsp/mail/MailDeleteRspProto");
class PacketMailDelete extends BaseProto_1.BaseProto {
    _data;
    constructor(success, mailId) {
        super(CommandID_1.CommandID.MAIL_DELETE);
        const proto = new MailDeleteRspProto_1.MailDeleteRspProto();
        proto.success = success;
        proto.mailId = mailId;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMailDelete = PacketMailDelete;
//# sourceMappingURL=PacketMailDelete.js.map