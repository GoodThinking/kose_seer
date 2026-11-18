"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoFollowOrHoomRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家响应
 *
 * 客户端解析（FollowCmdListener.as）：
 * - userId (4)
 * - superStage (4) - flag字段，客户端读取为superStage
 * - state (4) - boolean，跟随状态
 * - 如果跟随：
 *   - nick (16)
 *   - color (4)
 *   - power (4) - 体力值（需要*1000）
 *
 * 注意：客户端不读取 result 字段！直接从 userId 开始读取
 */
class NoNoFollowOrHoomRspProto extends BaseProto_1.BaseProto {
    userId = 0;
    superStage = 0; // flag字段，客户端读取为superStage
    state = 0; // 跟随状态（0=回家, 1=跟随）
    nick = ''; // 仅跟随时返回
    color = 0; // 仅跟随时返回
    power = 0; // 仅跟随时返回（体力值）
    isFollow = false; // 是否跟随
    constructor() {
        super(CommandID_1.CommandID.NONO_FOLLOW_OR_HOOM);
    }
    serialize() {
        if (this.isFollow) {
            // 跟随: userId(4) + superStage(4) + state(4) + nick(16) + color(4) + power(4) = 36 bytes
            // 注意：客户端不读取 result 字段，直接从 userId 开始读取
            const writer = new utils_1.BufferWriter(64);
            writer.WriteUInt32(this.userId);
            writer.WriteUInt32(this.superStage);
            writer.WriteUInt32(this.state);
            writer.WriteBytes(this.buildString(this.nick, 16));
            writer.WriteUInt32(this.color);
            writer.WriteUInt32(this.power);
            return writer.ToBuffer();
        }
        else {
            // 回家: userId(4) + superStage(4) + state(4) = 12 bytes
            // 注意：客户端不读取 result 字段，直接从 userId 开始读取
            const writer = new utils_1.BufferWriter(32);
            writer.WriteUInt32(this.userId);
            writer.WriteUInt32(this.superStage);
            writer.WriteUInt32(this.state);
            return writer.ToBuffer();
        }
    }
    // 链式调用辅助方法
    setUserId(value) {
        this.userId = value;
        return this;
    }
    setSuperStage(value) {
        this.superStage = value;
        return this;
    }
    setState(value) {
        this.state = value;
        return this;
    }
    setNick(value) {
        this.nick = value;
        return this;
    }
    setColor(value) {
        this.color = value;
        return this;
    }
    setPower(value) {
        this.power = value;
        return this;
    }
    setIsFollow(value) {
        this.isFollow = value;
        return this;
    }
}
exports.NoNoFollowOrHoomRspProto = NoNoFollowOrHoomRspProto;
//# sourceMappingURL=NoNoFollowOrHoomRspProto.js.map