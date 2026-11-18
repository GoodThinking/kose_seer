"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MainLoginReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录请求
 *
 * 米米号登录: passwordMD5(32字节)
 * 邮箱登录: email(64字节) + passwordMD5(32字节) + unknown(4) + loginType(4) + unknown(4)
 */
class MainLoginReqProto extends BaseProto_1.BaseProto {
    // 米米号登录
    passwordMD5;
    // 邮箱登录
    email;
    loginType;
    constructor() {
        super(0); // 请求Proto不需要cmdId
    }
    serialize() {
        // 请求由客户端发送，服务器不需要序列化
        return Buffer.alloc(0);
    }
    /**
     * 从Buffer解析米米号登录请求
     */
    static fromMimiLogin(buffer) {
        const proto = new MainLoginReqProto();
        if (buffer.length >= 32) {
            proto.passwordMD5 = buffer.subarray(0, 32);
        }
        return proto;
    }
    /**
     * 从Buffer解析邮箱登录请求
     */
    static fromEmailLogin(buffer) {
        const proto = new MainLoginReqProto();
        if (buffer.length >= 64) {
            proto.email = buffer.toString('utf8', 0, 64).replace(/\0/g, '').trim();
        }
        if (buffer.length >= 96) {
            proto.passwordMD5 = buffer.subarray(64, 96);
        }
        if (buffer.length >= 104) {
            proto.loginType = buffer.readUInt32BE(100);
        }
        return proto;
    }
}
exports.MainLoginReqProto = MainLoginReqProto;
//# sourceMappingURL=MainLoginReqProto.js.map