"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendAnswerReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 好友请求回复
 * CMD 2152
 *
 * 请求格式: targetId(4) + accept(4)
 */
class FriendAnswerReqProto extends BaseProto_1.BaseProto {
    targetId = 0;
    accept = 0;
    constructor() {
        super(CommandID_1.CommandID.FRIEND_ANSWER);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.targetId = buffer.readUInt32BE(offset);
            offset += 4;
        }
        if (buffer.length >= 8) {
            this.accept = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.FriendAnswerReqProto = FriendAnswerReqProto;
//# sourceMappingURL=FriendAnswerReqProto.js.map