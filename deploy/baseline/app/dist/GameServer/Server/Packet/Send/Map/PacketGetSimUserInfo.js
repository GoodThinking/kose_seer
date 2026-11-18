"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetSimUserInfo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetSimUserInfoRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/GetSimUserInfoRspProto");
/**
 * 获取简单用户信息响应包
 * CMD 1005
 */
class PacketGetSimUserInfo extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, nick, color) {
        super(CommandID_1.CommandID.GET_SIM_USERINFO);
        const proto = new GetSimUserInfoRspProto_1.GetSimUserInfoRspProto();
        proto.userId = userId;
        proto.nick = nick;
        proto.color = color;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetSimUserInfo = PacketGetSimUserInfo;
//# sourceMappingURL=PacketGetSimUserInfo.js.map