"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketBlackAdd = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BlackAddRspProto_1 = require("../../../../../shared/proto/packets/rsp/friend/BlackAddRspProto");
/**
 * 添加黑名单响应包
 * CMD 2154
 */
class PacketBlackAdd extends BaseProto_1.BaseProto {
    _data;
    constructor(result = 0) {
        super(CommandID_1.CommandID.BLACK_ADD);
        const proto = new BlackAddRspProto_1.BlackAddRspProto();
        if (result !== 0) {
            proto.setResult(result);
        }
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketBlackAdd = PacketBlackAdd;
//# sourceMappingURL=PacketBlackAdd.js.map