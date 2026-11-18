"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketCreateRole = void 0;
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const proto_1 = require("../../../../../shared/proto");
/**
 * [CMD: CREATE_ROLE (108)] 创建角色响应数据包
 */
class PacketCreateRole {
    _packetBuilder;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 构建创建角色响应
     * @param userID 用户ID
     * @param result 结果码 (0=成功, 5001=系统错误)
     * @param sessionKey 会话密钥 (成功时需要)
     */
    Build(userID, result = 0, sessionKey) {
        // 成功时返回 session
        if (result === 0 && sessionKey) {
            const proto = new proto_1.CreateRoleRspProto();
            proto.setSession(sessionKey);
            return this._packetBuilder.Build(CommandID_1.CommandID.CREATE_ROLE, userID, result, proto.serialize());
        }
        // 失败时返回空 body
        return this._packetBuilder.Build(CommandID_1.CommandID.CREATE_ROLE, userID, result, Buffer.alloc(0));
    }
}
exports.PacketCreateRole = PacketCreateRole;
//# sourceMappingURL=PacketCreateRole.js.map