"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSeeOnline = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const SeeOnlineRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/SeeOnlineRspProto");
/**
 * 查看在线状态响应包
 * CMD 2157
 */
class PacketSeeOnline extends BaseProto_1.BaseProto {
    _data;
    constructor(onlineList, result = 0) {
        super(CommandID_1.CommandID.SEE_ONLINE);
        const proto = new SeeOnlineRspProto_1.SeeOnlineRspProto();
        proto.onlineList = onlineList;
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketSeeOnline = PacketSeeOnline;
//# sourceMappingURL=PacketSeeOnline.js.map