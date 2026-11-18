"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoFollowOrHoom = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoFollowOrHoomRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoFollowOrHoomRspProto");
/**
 * NoNo 跟随或回家响应包
 * CMD 9019
 */
class PacketNoNoFollowOrHoom extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, superStage, state, isFollow, nick, color, power) {
        super(CommandID_1.CommandID.NONO_FOLLOW_OR_HOOM);
        const proto = new NoNoFollowOrHoomRspProto_1.NoNoFollowOrHoomRspProto();
        proto.userId = userId;
        proto.superStage = superStage;
        proto.state = state;
        proto.isFollow = isFollow;
        if (isFollow && nick !== undefined && color !== undefined && power !== undefined) {
            proto.nick = nick;
            proto.color = color;
            proto.power = power;
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoFollowOrHoom = PacketNoNoFollowOrHoom;
//# sourceMappingURL=PacketNoNoFollowOrHoom.js.map