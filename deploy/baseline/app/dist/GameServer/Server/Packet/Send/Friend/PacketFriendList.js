"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFriendList = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FriendListRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/FriendListRspProto");
/**
 * 好友列表响应包
 * CMD 2158
 */
class PacketFriendList extends BaseProto_1.BaseProto {
    _data;
    constructor(friendList, result = 0) {
        super(CommandID_1.CommandID.FRIEND_LIST);
        const proto = new FriendListRspProto_1.FriendListRspProto();
        proto.friendList = friendList;
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketFriendList = PacketFriendList;
//# sourceMappingURL=PacketFriendList.js.map