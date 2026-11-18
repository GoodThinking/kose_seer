"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketEscapeFight = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const EscapeFightRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/EscapeFightRspProto");
/**
 * 逃跑包
 * CMD 2410
 */
class PacketEscapeFight extends BaseProto_1.BaseProto {
    _data;
    constructor(success = 1) {
        super(CommandID_1.CommandID.ESCAPE_FIGHT);
        const proto = new EscapeFightRspProto_1.EscapeFightRspProto();
        proto.setSuccess(success);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketEscapeFight = PacketEscapeFight;
//# sourceMappingURL=PacketEscapeFight.js.map