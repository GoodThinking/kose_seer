"use strict";
/**
 * 获取未读邮件数量响应包
 * CMD 2757
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMailGetUnread = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MailGetUnreadRspProto_1 = require("../../../../../shared/proto/packets/rsp/mail/MailGetUnreadRspProto");
class PacketMailGetUnread extends BaseProto_1.BaseProto {
    _data;
    constructor(count) {
        super(CommandID_1.CommandID.MAIL_GET_UNREAD);
        const proto = new MailGetUnreadRspProto_1.MailGetUnreadRspProto();
        proto.count = count;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMailGetUnread = PacketMailGetUnread;
//# sourceMappingURL=PacketMailGetUnread.js.map