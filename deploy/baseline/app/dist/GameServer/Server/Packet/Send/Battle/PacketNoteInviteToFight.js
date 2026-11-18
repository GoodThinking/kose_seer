"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoteInviteToFight = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoteInviteToFightRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/NoteInviteToFightRspProto");
/**
 * [CMD: 2501 NOTE_INVITE_TO_FIGHT] 对战邀请通知包装器
 */
class PacketNoteInviteToFight extends BaseProto_1.BaseProto {
    _data;
    constructor(inviterUserId, inviterNick, mode = 0) {
        super(CommandID_1.CommandID.NOTE_INVITE_TO_FIGHT);
        const proto = new NoteInviteToFightRspProto_1.NoteInviteToFightRspProto();
        proto.inviterUserId = inviterUserId;
        proto.inviterNick = inviterNick;
        proto.mode = mode;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoteInviteToFight = PacketNoteInviteToFight;
//# sourceMappingURL=PacketNoteInviteToFight.js.map