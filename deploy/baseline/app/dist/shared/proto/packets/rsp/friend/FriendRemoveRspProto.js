"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendRemoveRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 删除好友响应
 * CMD 2153
 *
 * 响应格式: 空包
 */
class FriendRemoveRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.FRIEND_REMOVE);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    deserialize(buffer) {
        // 空包，无需解析
    }
}
exports.FriendRemoveRspProto = FriendRemoveRspProto;
//# sourceMappingURL=FriendRemoveRspProto.js.map