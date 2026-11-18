"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteInviteToFightRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2501 NOTE_INVITE_TO_FIGHT] 对战邀请通知
 *
 * 推送给被邀请者，通知有人邀请对战
 *
 * 响应格式：
 * - inviterUserId: uint32 - 邀请者ID
 * - inviterNick: string[16] - 邀请者昵称
 * - mode: uint32 - 对战模式（0=普通对战）
 */
class NoteInviteToFightRspProto extends BaseProto_1.BaseProto {
    inviterUserId = 0;
    inviterNick = '';
    mode = 0;
    constructor() {
        super(CommandID_1.CommandID.NOTE_INVITE_TO_FIGHT);
    }
    serialize() {
        const buffer = Buffer.alloc(24); // 4 + 16 + 4
        buffer.writeUInt32BE(this.inviterUserId, 0);
        // 写入昵称（16字节，UTF-8编码）
        const nickBuffer = Buffer.from(this.inviterNick, 'utf8');
        nickBuffer.copy(buffer, 4, 0, Math.min(nickBuffer.length, 16));
        // 写入对战模式
        buffer.writeUInt32BE(this.mode, 20);
        return buffer;
    }
}
exports.NoteInviteToFightRspProto = NoteInviteToFightRspProto;
//# sourceMappingURL=NoteInviteToFightRspProto.js.map