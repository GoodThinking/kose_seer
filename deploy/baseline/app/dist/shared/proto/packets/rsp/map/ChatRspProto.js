"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2102 CHAT] 聊天响应
 */
class ChatRspProto extends BaseProto_1.BaseProto {
    senderId = 0; // 发送者ID
    senderNick = ''; // 发送者昵称 (16字节)
    toId = 0; // 接收者ID (0=公共聊天)
    msg = ''; // 消息内容
    constructor() {
        super(CommandID_1.CommandID.CHAT);
    }
    serialize() {
        const msgBuffer = Buffer.from(this.msg, 'utf8');
        const writer = new utils_1.BufferWriter(256);
        writer.WriteUInt32(this.senderId);
        writer.WriteBytes(this.buildString(this.senderNick, 16));
        writer.WriteUInt32(this.toId);
        writer.WriteUInt32(msgBuffer.length);
        writer.WriteBytes(msgBuffer);
        return writer.ToBuffer();
    }
    // 链式调用辅助方法
    setSenderId(value) {
        this.senderId = value;
        return this;
    }
    setSenderNick(value) {
        this.senderNick = value;
        return this;
    }
    setToId(value) {
        this.toId = value;
        return this;
    }
    setMsg(value) {
        this.msg = value;
        return this;
    }
}
exports.ChatRspProto = ChatRspProto;
//# sourceMappingURL=ChatRspProto.js.map