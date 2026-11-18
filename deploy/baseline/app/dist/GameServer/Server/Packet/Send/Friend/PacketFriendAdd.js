"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFriendAdd = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FriendAddRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/FriendAddRspProto");
/**
 * 添加好友响应包
 * CMD 2151
 */
class PacketFriendAdd extends BaseProto_1.BaseProto {
    _data;
    constructor(targetId, result = 0) {
        super(CommandID_1.CommandID.FRIEND_ADD);
        const proto = new FriendAddRspProto_1.FriendAddRspProto();
        proto.targetId = targetId;
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketFriendAdd = PacketFriendAdd;
//# sourceMappingURL=PacketFriendAdd.js.map