"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketRegister = void 0;
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const proto_1 = require("../../../../../shared/proto");
/**
 * [CMD: REGISTER (2)] 注册账号响应数据包
 */
class PacketRegister {
    _packetBuilder;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 构建注册账号响应
     * @param userID 新注册的米米号 (成功时返回)
     * @param result 结果码 (0=成功, 5001=系统错误, 5002=邮箱已注册, 5012=验证码错误)
     */
    Build(userID, result = 0) {
        const proto = new proto_1.RegisterRspProto().setUserID(userID).setResult(result);
        return this._packetBuilder.Build(CommandID_1.CommandID.REGISTER, userID, result, proto.serialize());
    }
}
exports.PacketRegister = PacketRegister;
//# sourceMappingURL=PacketRegister.js.map