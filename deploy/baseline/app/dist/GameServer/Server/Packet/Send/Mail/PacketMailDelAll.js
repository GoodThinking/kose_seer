"use strict";
/**
 * 删除所有已读邮件响应包
 * CMD 2756
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMailDelAll = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const MailDelAllRspProto_1 = require("../../../../../shared/proto/packets/rsp/mail/MailDelAllRspProto");
class PacketMailDelAll extends BaseProto_1.BaseProto {
    _data;
    constructor(count) {
        super(CommandID_1.CommandID.MAIL_DEL_ALL);
        const proto = new MailDelAllRspProto_1.MailDelAllRspProto();
        proto.count = count;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketMailDelAll = PacketMailDelAll;
//# sourceMappingURL=PacketMailDelAll.js.map