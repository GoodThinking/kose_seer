"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendAddReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 添加好友请求
 * CMD 2151
 *
 * 请求格式: targetId(4)
 */
class FriendAddReqProto extends BaseProto_1.BaseProto {
    targetId = 0;
    constructor() {
        super(CommandID_1.CommandID.FRIEND_ADD);
    }
    deserialize(buffer) {
        if (buffer.length >= 4) {
            this.targetId = buffer.readUInt32BE(0);
        }
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.FriendAddReqProto = FriendAddReqProto;
//# sourceMappingURL=FriendAddReqProto.js.map