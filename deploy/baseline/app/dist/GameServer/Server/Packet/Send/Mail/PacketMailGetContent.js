"use strict";
/**
 * 读取邮件内容响应包
 * CMD 2753
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMailGetContent = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MailGetContentRspProto_1 = require("../../../../../shared/proto/packets/rsp/mail/MailGetContentRspProto");
class PacketMailGetContent extends BaseProto_1.BaseProto {
    _data;
    constructor(mail) {
        super(CommandID_1.CommandID.MAIL_GET_CONTENT);
        const proto = new MailGetContentRspProto_1.MailGetContentRspProto();
        if (mail) {
            proto.success = true;
            proto.mail = mail;
        }
        else {
            proto.success = false;
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMailGetContent = PacketMailGetContent;
//# sourceMappingURL=PacketMailGetContent.js.map