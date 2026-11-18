"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketChat = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChatRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/ChatRspProto");
/**
 * 聊天响应包
 * CMD 1014
 */
class PacketChat extends BaseProto_1.BaseProto {
    _data;
    constructor(senderId, senderNick, toId, msg) {
        super(CommandID_1.CommandID.CHAT);
        const proto = new ChatRspProto_1.ChatRspProto();
        proto.senderId = senderId;
        proto.senderNick = senderNick;
        proto.toId = toId;
        proto.msg = msg;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketChat = PacketChat;
//# sourceMappingURL=PacketChat.js.map