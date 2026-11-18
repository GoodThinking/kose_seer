"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketFriendAnswer = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FriendAnswerRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/FriendAnswerRspProto");
/**
 * 好友请求回复响应包
 * CMD 2152
 */
class PacketFriendAnswer extends BaseProto_1.BaseProto {
    _data;
    constructor(accept, result = 0) {
        super(CommandID_1.CommandID.FRIEND_ANSWER);
        const proto = new FriendAnswerRspProto_1.FriendAnswerRspProto();
        proto.accept = accept;
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketFriendAnswer = PacketFriendAnswer;
//# sourceMappingURL=PacketFriendAnswer.js.map