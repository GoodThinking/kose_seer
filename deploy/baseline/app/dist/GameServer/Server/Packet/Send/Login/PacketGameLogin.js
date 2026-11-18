"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGameLogin = void 0;
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const models_1 = require("../../../../../shared/models");
/**
 * [CMD: LOGIN_IN (1001)] 游戏登录响应数据包
 */
class PacketGameLogin {
    _packetBuilder;
    constructor(packetBuilder) {
        this._packetBuilder = packetBuilder;
    }
    /**
     * 构建游戏登录响应
     * @param userID 用户ID
     * @param result 结果码 (0=成功)
     * @param player 玩家数据 (成功时需要)
     * @param sessionKey 会话标识
     */
    Build(userID, result = 0, player, sessionKey, protocol = 'kose') {
        // 失败时返回空 body
        if (result !== 0 || !player) {
            return this._packetBuilder.Build(CommandID_1.CommandID.LOGIN_IN, userID, result, Buffer.alloc(0));
        }
        const proto = this.BuildProto(player, sessionKey);
        return this._packetBuilder.Build(CommandID_1.CommandID.LOGIN_IN, userID, result, proto.serialize(protocol));
    }
    /**
     * 构建游戏登录Proto（供Player.SendPacket使用）
     */
    BuildProto(player, sessionKey) {
        return (0, models_1.PlayerInfoToLoginProto)(player, sessionKey);
    }
}
exports.PacketGameLogin = PacketGameLogin;
//# sourceMappingURL=PacketGameLogin.js.map