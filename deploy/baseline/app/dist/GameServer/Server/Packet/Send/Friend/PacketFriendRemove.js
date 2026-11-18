"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFriendRemove = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FriendRemoveRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/FriendRemoveRspProto");
/**
 * 删除好友响应包
 * CMD 2153
 */
class PacketFriendRemove extends BaseProto_1.BaseProto {
    _data;
    constructor(result = 0) {
        super(CommandID_1.CommandID.FRIEND_REMOVE);
        const proto = new FriendRemoveRspProto_1.FriendRemoveRspProto();
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketFriendRemove = PacketFriendRemove;
//# sourceMappingURL=PacketFriendRemove.js.map