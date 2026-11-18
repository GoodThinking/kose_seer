"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendAnswerRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 好友请求回复响应
 * CMD 2152
 *
 * 响应格式: accept(4)
 */
class FriendAnswerRspProto extends BaseProto_1.BaseProto {
    accept = 0;
    constructor() {
        super(CommandID_1.CommandID.FRIEND_ANSWER);
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.accept, 0);
        return buffer;
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.accept = buffer.readUInt32BE(0);
        }
    }
    // 链式调用辅助方法
    setAccept(accept) {
        this.accept = accept;
        return this;
    }
}
exports.FriendAnswerRspProto = FriendAnswerRspProto;
//# sourceMappingURL=FriendAnswerRspProto.js.map