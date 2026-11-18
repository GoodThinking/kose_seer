"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketRequestRegister = void 0;
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const proto_1 = require("../../../../../shared/proto");
/**
 * [CMD: REQUEST_REGISTER (1003)] 请求注册响应数据包
 */
class PacketRequestRegister {
    _packetBuilder;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 构建请求注册响应
     * @param result 结果码 (0=成功)
     */
    Build(result = 0) {
        const proto = new proto_1.RequestRegisterRspProto().setResult(result);
        return this._packetBuilder.Build(CommandID_1.CommandID.REQUEST_REGISTER, 0, result, proto.serialize());
    }
}
exports.PacketRequestRegister = PacketRequestRegister;
//# sourceMappingURL=PacketRequestRegister.js.map