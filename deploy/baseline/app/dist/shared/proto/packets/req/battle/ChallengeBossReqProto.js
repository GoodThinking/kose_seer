"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChallengeBossReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2411 CHALLENGE_BOSS] 挑战BOSS请求
 *
 * 注意：虽然go-server使用param2，但实际客户端发送的是bossId
 * 我们的实现使用bossId作为BOSS配置的唯一标识
 */
class ChallengeBossReqProto extends BaseProto_1.BaseProto {
    bossId = 0;
    constructor() {
        super(CommandID_1.CommandID.CHALLENGE_BOSS);
    }
    deserialize(buffer) {
        let offset = 0;
        // 读取 bossId (uint32)
        this.bossId = buffer.readUInt32BE(offset);
        offset += 4;
    }
    serialize() {
        const buffer = Buffer.alloc(4);
        let offset = 0;
        // 写入 bossId (uint32)
        buffer.writeUInt32BE(this.bossId, offset);
        offset += 4;
        return buffer;
    }
}
exports.ChallengeBossReqProto = ChallengeBossReqProto;
//# sourceMappingURL=ChallengeBossReqProto.js.map