"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeeOnlineRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2157 SEE_ONLINE] 查看在线状态响应
 *
 * 响应格式:
 * - onlineCount (uint32) - 在线用户数量
 * - 对于每个在线用户：
 *   - userId (uint32) - 用户ID
 *   - serverId (uint32) - 服务器ID
 *   - mapType (uint32) - 地图类型
 *   - mapId (uint32) - 地图ID
 */
class SeeOnlineRspProto extends BaseProto_1.BaseProto {
    onlineList = [];
    constructor() {
        super(CommandID_1.CommandID.SEE_ONLINE);
    }
    setOnlineUsers(users) {
        this.onlineList = users;
    }
    serialize() {
        const buffers = [];
        // onlineCount
        const countBuf = Buffer.allocUnsafe(4);
        countBuf.writeUInt32BE(this.onlineList.length, 0);
        buffers.push(countBuf);
        // 在线用户列表
        for (const user of this.onlineList) {
            const userBuf = Buffer.allocUnsafe(16);
            userBuf.writeUInt32BE(user.userId, 0);
            userBuf.writeUInt32BE(user.serverId, 4);
            userBuf.writeUInt32BE(user.mapType, 8);
            userBuf.writeUInt32BE(user.mapId, 12);
            buffers.push(userBuf);
        }
        return Buffer.concat(buffers);
    }
}
exports.SeeOnlineRspProto = SeeOnlineRspProto;
//# sourceMappingURL=SeeOnlineRspProto.js.map