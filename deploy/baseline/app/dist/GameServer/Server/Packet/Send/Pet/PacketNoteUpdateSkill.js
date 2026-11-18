"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoteUpdateSkill = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoteUpdateSkillRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/NoteUpdateSkillRspProto");
/**
 * NOTE_UPDATE_SKILL 数据包 (2507)
 * 推送精灵技能更新信息
 */
class PacketNoteUpdateSkill extends BaseProto_1.BaseProto {
    _data;
    constructor(pets) {
        super(CommandID_1.CommandID.NOTE_UPDATE_SKILL);
        const proto = new NoteUpdateSkillRspProto_1.NoteUpdateSkillRspProto();
        proto.pets = pets;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoteUpdateSkill = PacketNoteUpdateSkill;
//# sourceMappingURL=PacketNoteUpdateSkill.js.map