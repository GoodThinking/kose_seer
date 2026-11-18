"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketChangeNickName = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChangeNickNameRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/ChangeNickNameRspProto");
/**
 * 修改昵称响应包
 * CMD 1007
 */
class PacketChangeNickName extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, newNick) {
        super(CommandID_1.CommandID.CHANG_NICK_NAME);
        const proto = new ChangeNickNameRspProto_1.ChangeNickNameRspProto();
        proto.userId = userId;
        proto.newNick = newNick;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketChangeNickName = PacketChangeNickName;
//# sourceMappingURL=PacketChangeNickName.js.map