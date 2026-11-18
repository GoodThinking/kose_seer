"use strict";
/**
 * 标记邮件为已读响应包
 * CMD 2754
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMailSetReaded = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MailSetReadedRspProto_1 = require("../../../../../shared/proto/packets/rsp/mail/MailSetReadedRspProto");
class PacketMailSetReaded extends BaseProto_1.BaseProto {
    _data;
    constructor(success, mailId) {
        super(CommandID_1.CommandID.MAIL_SET_READED);
        const proto = new MailSetReadedRspProto_1.MailSetReadedRspProto();
        proto.success = success;
        proto.mailId = mailId;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMailSetReaded = PacketMailSetReaded;
//# sourceMappingURL=PacketMailSetReaded.js.map