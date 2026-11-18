"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: REGISTER (2)] 注册账号响应
 *
 * 响应格式:
 * - result: 错误码 (0=成功, 5001=系统错误, 5002=邮箱已注册, 5012=验证码错误)
 * - userID: 新注册的米米号 (成功时返回)
 */
class RegisterRspProto extends BaseProto_1.BaseProto {
    userID = 0;
    constructor() {
        super(CommandID_1.CommandID.REGISTER);
    }
    serialize() {
        // 注册响应不需要body，userID通过包头返回
        return Buffer.alloc(0);
    }
    /**
     * 辅助方法：设置用户ID
     */
    setUserID(userID) {
        this.userID = userID;
        return this;
    }
}
exports.RegisterRspProto = RegisterRspProto;
//# sourceMappingURL=RegisterRspProto.js.map