"use strict";
/**
 * 获取邮件列表响应包
 * CMD 2751
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMailGetList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MailGetListRspProto_1 = require("../../../../../shared/proto/packets/rsp/mail/MailGetListRspProto");
class PacketMailGetList extends BaseProto_1.BaseProto {
    _data;
    constructor(total, mails) {
        super(CommandID_1.CommandID.MAIL_GET_LIST);
        const proto = new MailGetListRspProto_1.MailGetListRspProto();
        proto.total = total;
        proto.count = mails.length;
        proto.mails = mails;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMailGetList = PacketMailGetList;
//# sourceMappingURL=PacketMailGetList.js.map