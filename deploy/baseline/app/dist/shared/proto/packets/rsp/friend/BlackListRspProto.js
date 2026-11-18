"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlackListRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 黑名单列表响应
 * CMD 2159
 *
 * 响应格式:
 * - blackCount(4)
 * - [BlackInfo]...
 *   - userID(4)
 *   - nickname(16)
 *   - color(4)
 */
class BlackListRspProto extends BaseProto_1.BaseProto {
    blackList = [];
    constructor() {
        super(CommandID_1.CommandID.BLACK_LIST);
    }
    serialize() {
        const blackCount = this.blackList.length;
        const bufferSize = 4 + (blackCount * 24); // count(4) + [24 bytes per black]
        const buffer = Buffer.alloc(bufferSize);
        let offset = 0;
        // 写入黑名单数量
        buffer.writeUInt32BE(blackCount, offset);
        offset += 4;
        // 写入每个黑名单信息
        for (const black of this.blackList) {
            // userID(4)
            buffer.writeUInt32BE(black.userId, offset);
            offset += 4;
            // nickname(16) - 固定长度字符串
            const nicknameBuffer = Buffer.from(black.nickname, 'utf8');
            const nicknameToCopy = nicknameBuffer.slice(0, 16);
            nicknameToCopy.copy(buffer, offset);
            offset += 16;
            // color(4)
            buffer.writeUInt32BE(black.color, offset);
            offset += 4;
        }
        return buffer;
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length < 4)
            return;
        const blackCount = buffer.readUInt32BE(offset);
        offset += 4;
        this.blackList = [];
        for (let i = 0; i < blackCount; i++) {
            if (offset + 24 <= buffer.length) {
                const userId = buffer.readUInt32BE(offset);
                offset += 4;
                const nicknameBuffer = buffer.slice(offset, offset + 16);
                const nickname = nicknameBuffer.toString('utf8').replace(/\0/g, '');
                offset += 16;
                const color = buffer.readUInt32BE(offset);
                offset += 4;
                this.blackList.push({ userId, nickname, color });
            }
        }
    }
    // 链式调用辅助方法
    setBlackList(blackList) {
        this.blackList = blackList;
        return this;
    }
}
exports.BlackListRspProto = BlackListRspProto;
//# sourceMappingURL=BlackListRspProto.js.map