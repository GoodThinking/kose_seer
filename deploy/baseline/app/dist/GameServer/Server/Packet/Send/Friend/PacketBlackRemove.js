"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketBlackRemove = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BlackRemoveRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/BlackRemoveRspProto");
/**
 * 移除黑名单响应包
 * CMD 2155
 */
class PacketBlackRemove extends BaseProto_1.BaseProto {
    _data;
    constructor(result = 0) {
        super(CommandID_1.CommandID.BLACK_REMOVE);
        const proto = new BlackRemoveRspProto_1.BlackRemoveRspProto();
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketBlackRemove = PacketBlackRemove;
//# sourceMappingURL=PacketBlackRemove.js.map