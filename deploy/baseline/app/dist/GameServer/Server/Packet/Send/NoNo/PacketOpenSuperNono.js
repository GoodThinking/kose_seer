"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketOpenSuperNono = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const OpenSuperNonoRspProto_1 = require("../../../../../shared/proto/packets/rsp/nono/OpenSuperNonoRspProto");
/**
 * 开启超级NoNo响应包
 */
class PacketOpenSuperNono extends BaseProto_1.BaseProto {
    _data;
    constructor(success = 0) {
        super(CommandID_1.CommandID.OPEN_SUPER_NONO);
        const proto = new OpenSuperNonoRspProto_1.OpenSuperNonoRspProto(success);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketOpenSuperNono = PacketOpenSuperNono;
//# sourceMappingURL=PacketOpenSuperNono.js.map