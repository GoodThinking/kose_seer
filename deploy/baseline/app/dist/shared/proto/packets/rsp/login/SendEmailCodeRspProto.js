"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SendEmailCodeRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: SEND_EMAIL_CODE (3)] 发送邮箱验证码响应
 *
 * 响应格式:
 * - emailCodeRes(32字节): 验证码响应（用于后续注册验证）
 */
class SendEmailCodeRspProto extends BaseProto_1.BaseProto {
    emailCodeRes = '';
    constructor() {
        super(CommandID_1.CommandID.SEND_EMAIL_CODE);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(32);
        writer.WriteString(this.emailCodeRes, 32);
        return writer.ToBuffer();
    }
    /**
     * 辅助方法：设置验证码响应
     */
    setEmailCodeRes(codeRes) {
        this.emailCodeRes = codeRes;
        return this;
    }
}
exports.SendEmailCodeRspProto = SendEmailCodeRspProto;
//# sourceMappingURL=SendEmailCodeRspProto.js.map