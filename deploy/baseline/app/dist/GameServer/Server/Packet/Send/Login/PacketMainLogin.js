"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMainLogin = void 0;
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const proto_1 = require("../../../../../shared/proto");
/**
 * [CMD: MAIN_LOGIN_IN (104)] 主登录响应数据包
 */
class PacketMainLogin {
    _packetBuilder;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 构建主登录成功响应
     * @param userID 用户ID
     * @param roleCreated 是否已创建角色
     * @param sessionKey 会话密钥 (可选，不传则随机生成)
     */
    Build(userID, roleCreated = true, sessionKey) {
        const proto = new proto_1.MainLoginRspProto();
        proto.setSession(sessionKey);
        proto.setRoleCreated(roleCreated);
        return this._packetBuilder.Build(CommandID_1.CommandID.MAIN_LOGIN_IN, userID, 0, // result: 0=成功
        proto.serialize());
    }
    /**
     * 构建主登录失败响应
     * @param userID 用户ID
     * @param errorCode 错误码 (使用 LoginResult 枚举)
     *   - 5001: 系统错误
     *   - 5003: 密码错误
     *   - 5005: 号码不存在
     *   - 5006: 号码被永久封停
     *   - 5007: 号码被24小时封停
     *   - 5015: 号码被7天封停
     *   - 5016: 号码被14天封停
     */
    BuildFailed(userID, errorCode) {
        return this._packetBuilder.Build(CommandID_1.CommandID.MAIN_LOGIN_IN, userID, errorCode, // result: 非0=失败
        Buffer.alloc(0));
    }
}
exports.PacketMainLogin = PacketMainLogin;
//# sourceMappingURL=PacketMainLogin.js.map