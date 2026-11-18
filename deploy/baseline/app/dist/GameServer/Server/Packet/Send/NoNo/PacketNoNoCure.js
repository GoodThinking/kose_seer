"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoCure = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoCureRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoCureRspProto");
/**
 * NoNo 治疗响应包
 * CMD 9007
 *
 * 空响应包
 */
class PacketNoNoCure extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        super(CommandID_1.CommandID.NONO_CURE);
        const proto = new NoNoCureRspProto_1.NoNoCureRspProto();
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoCure = PacketNoNoCure;
//# sourceMappingURL=PacketNoNoCure.js.map