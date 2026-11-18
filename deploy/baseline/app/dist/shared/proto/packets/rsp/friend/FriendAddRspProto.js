"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendAddRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 添加好友响应
 * CMD 2151
 *
 * 响应格式: targetId(4)
 */
class FriendAddRspProto extends BaseProto_1.BaseProto {
    targetId = 0;
    constructor() {
        super(CommandID_1.CommandID.FRIEND_ADD);
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        buffer.writeUInt32BE(this.targetId, 0);
        return buffer;
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.targetId = buffer.readUInt32BE(0);
        }
    }
    // 链式调用辅助方法
    setTargetId(targetId) {
        this.targetId = targetId;
        return this;
    }
}
exports.FriendAddRspProto = FriendAddRspProto;
//# sourceMappingURL=FriendAddRspProto.js.map