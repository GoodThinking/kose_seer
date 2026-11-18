"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const SessionToken_1 = require("../../../../protocol/SessionToken");
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录请求
 * 用于解析客户端发来的登录请求
 */
class LoginReqProto extends BaseProto_1.BaseProto {
    session = Buffer.alloc(16);
    constructor() {
        super(0); // 请求Proto不需要cmdId
    }
    serialize() {
        return this.session;
    }
    /**
     * 从Buffer快速解析
     */
    static fromBuffer(buffer) {
        const proto = new LoginReqProto();
        if (buffer.length !== 16)
            throw new Error('Invalid session wire length');
        proto.session = Buffer.from(buffer);
        return proto;
    }
    /**
     * 获取Session字符串
     */
    getSessionKey() {
        return (0, SessionToken_1.SessionKeyFromWire)(this.session);
    }
}
exports.LoginReqProto = LoginReqProto;
//# sourceMappingURL=LoginReqProto.js.map