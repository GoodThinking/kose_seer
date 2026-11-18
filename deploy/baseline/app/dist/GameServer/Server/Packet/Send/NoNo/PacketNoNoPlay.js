"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoPlay = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoPlayRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoPlayRspProto");
/**
 * NoNo 玩耍响应包
 * CMD 9013
 */
class PacketNoNoPlay extends BaseProto_1.BaseProto {
    _data;
    constructor(power, ai, mate, iq) {
        super(CommandID_1.CommandID.NONO_PLAY);
        const proto = new NoNoPlayRspProto_1.NoNoPlayRspProto();
        proto.power = power;
        proto.ai = ai;
        proto.mate = mate;
        proto.iq = iq;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoPlay = PacketNoNoPlay;
//# sourceMappingURL=PacketNoNoPlay.js.map