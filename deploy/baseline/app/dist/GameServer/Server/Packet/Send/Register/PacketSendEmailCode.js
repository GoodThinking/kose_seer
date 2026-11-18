"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSendEmailCode = void 0;
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const proto_1 = require("../../../../../shared/proto");
/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码响应数据包
 */
class PacketSendEmailCode {
    _packetBuilder;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 构建发送验证码响应
     * @param emailCodeRes 验证码响应（32字节）
     * @param result 结果码 (0=成功, 5001=系统错误)
     */
    Build(emailCodeRes, result = 0) {
        const proto = new proto_1.SendEmailCodeRspProto()
            .setEmailCodeRes(emailCodeRes)
            .setResult(result);
        return this._packetBuilder.Build(CommandID_1.CommandID.SEND_EMAIL_CODE, 0, // 注册前没有userID
        result, proto.serialize());
    }
}
exports.PacketSendEmailCode = PacketSendEmailCode;
//# sourceMappingURL=PacketSendEmailCode.js.map