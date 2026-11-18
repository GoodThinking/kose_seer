"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoteUseSkill = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoteUseSkillRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/NoteUseSkillRspProto");
/**
 * 使用技能通知包
 * CMD 2505
 */
class PacketNoteUseSkill extends BaseProto_1.BaseProto {
    _data;
    constructor(firstAttack, secondAttack, protocol = 'kose') {
        super(CommandID_1.CommandID.NOTE_USE_SKILL);
        const proto = new NoteUseSkillRspProto_1.NoteUseSkillRspProto();
        proto.setFirstAttack(firstAttack);
        proto.setSecondAttack(secondAttack);
        this._data = proto.serialize(protocol);
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoteUseSkill = PacketNoteUseSkill;
//# sourceMappingURL=PacketNoteUseSkill.js.map