"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoteHandleFightInvite = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoteHandleFightInviteRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/NoteHandleFightInviteRspProto");
/**
 * [CMD: 2502 NOTE_HANDLE_FIGHT_INVITE] 处理邀请通知包装器
 */
class PacketNoteHandleFightInvite extends BaseProto_1.BaseProto {
    _data;
    constructor(targetUserId, targetNick, accept) {
        super(CommandID_1.CommandID.NOTE_HANDLE_FIGHT_INVITE);
        const proto = new NoteHandleFightInviteRspProto_1.NoteHandleFightInviteRspProto();
        proto.targetUserId = targetUserId;
        proto.targetNick = targetNick;
        proto.accept = accept;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoteHandleFightInvite = PacketNoteHandleFightInvite;
//# sourceMappingURL=PacketNoteHandleFightInvite.js.map