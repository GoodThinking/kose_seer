"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteUpdateSkillRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
class NoteUpdateSkillRspProto extends BaseProto_1.BaseProto {
    pets = [];
    constructor() {
        super(CommandID_1.CommandID.NOTE_UPDATE_SKILL);
    }
    serialize() {
        const petCount = this.pets.length;
        // 计算总大小：4 (count) + sum(4 + 4 + 4 + activeCount*4 + unactiveCount*4)
        let totalSize = 4;
        for (const pet of this.pets) {
            totalSize += 4 + 4 + 4 + pet.activeSkills.length * 4 + pet.unactiveSkills.length * 4;
        }
        const buffer = Buffer.alloc(totalSize);
        let offset = 0;
        // count (4 bytes)
        buffer.writeUInt32BE(petCount, offset);
        offset += 4;
        // pets array
        for (const pet of this.pets) {
            // catchTime (4 bytes)
            buffer.writeUInt32BE(pet.catchTime, offset);
            offset += 4;
            // activeSkillCount (4 bytes)
            buffer.writeUInt32BE(pet.activeSkills.length, offset);
            offset += 4;
            // unactiveSkillCount (4 bytes)
            buffer.writeUInt32BE(pet.unactiveSkills.length, offset);
            offset += 4;
            // activeSkills array
            for (const skillId of pet.activeSkills) {
                buffer.writeUInt32BE(skillId, offset);
                offset += 4;
            }
            // unactiveSkills array
            for (const skillId of pet.unactiveSkills) {
                buffer.writeUInt32BE(skillId, offset);
                offset += 4;
            }
        }
        return buffer;
    }
    deserialize(buffer) {
        // Not needed for response proto
    }
}
exports.NoteUpdateSkillRspProto = NoteUpdateSkillRspProto;
//# sourceMappingURL=NoteUpdateSkillRspProto.js.map