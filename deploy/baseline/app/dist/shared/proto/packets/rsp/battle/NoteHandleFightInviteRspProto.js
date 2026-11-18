"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteHandleFightInviteRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2502 NOTE_HANDLE_FIGHT_INVITE] 处理邀请通知
 *
 * 推送给邀请者，通知对方接受/拒绝了邀请
 *
 * 响应格式：
 * - targetUserId: uint32 - 被邀请者ID
 * - targetNick: string[16] - 被邀请者昵称
 * - accept: uint8 - 是否接受（1=接受，0=拒绝）
 */
class NoteHandleFightInviteRspProto extends BaseProto_1.BaseProto {
    targetUserId = 0;
    targetNick = '';
    accept = 0;
    constructor() {
        super(CommandID_1.CommandID.NOTE_HANDLE_FIGHT_INVITE);
    }
    serialize() {
        const buffer = Buffer.alloc(24); // 4 + 16 + 4
        buffer.writeUInt32BE(this.targetUserId, 0);
        // 写入昵称（16字节，UTF-8编码）
        const nickBuffer = Buffer.from(this.targetNick, 'utf8');
        nickBuffer.copy(buffer, 4, 0, Math.min(nickBuffer.length, 16));
        buffer.writeUInt32BE(this.accept, 20);
        return buffer;
    }
}
exports.NoteHandleFightInviteRspProto = NoteHandleFightInviteRspProto;
//# sourceMappingURL=NoteHandleFightInviteRspProto.js.map