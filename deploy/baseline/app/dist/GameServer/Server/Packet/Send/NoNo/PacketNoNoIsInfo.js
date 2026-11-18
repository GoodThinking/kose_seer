"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoNoIsInfo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const NoNoIsInfoRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/NoNoIsInfoRspProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * NoNo是否有信息响应包
 */
class PacketNoNoIsInfo extends BaseProto_1.BaseProto {
    _data;
    constructor(hasNono) {
        super(CommandID_1.CommandID.NONO_IS_INFO);
        const proto = new NoNoIsInfoRspProto_1.NoNoIsInfoRspProto().setHasNono(hasNono);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoNoIsInfo = PacketNoNoIsInfo;
//# sourceMappingURL=PacketNoNoIsInfo.js.map