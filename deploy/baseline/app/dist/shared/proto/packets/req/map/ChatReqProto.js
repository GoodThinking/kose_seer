"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2102 CHAT] 聊天请求
 */
class ChatReqProto extends BaseProto_1.BaseProto {
    chatType = 0; // 聊天类型
    msg = ''; // 消息内容
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new ChatReqProto();
        if (buffer.length >= 8) {
            proto.chatType = buffer.readUInt32BE(0);
            const msgLen = buffer.readUInt32BE(4);
            if (buffer.length >= 8 + msgLen) {
                proto.msg = buffer.toString('utf8', 8, 8 + msgLen);
            }
        }
        return proto;
    }
}
exports.ChatReqProto = ChatReqProto;
//# sourceMappingURL=ChatReqProto.js.map