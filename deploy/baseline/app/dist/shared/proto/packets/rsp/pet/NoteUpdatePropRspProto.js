"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteUpdatePropRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
class NoteUpdatePropRspProto extends BaseProto_1.BaseProto {
    addition = 0; // 加成百分比 * 100
    pets = [];
    constructor() {
        super(CommandID_1.CommandID.NOTE_UPDATE_PROP);
    }
    serialize() {
        const petCount = this.pets.length;
        const bodySize = 8 + petCount * 72; // 8 bytes header + 72 bytes per pet
        const buffer = Buffer.alloc(bodySize);
        let offset = 0;
        // addition (4 bytes)
        buffer.writeUInt32BE(this.addition, offset);
        offset += 4;
        // count (4 bytes)
        buffer.writeUInt32BE(petCount, offset);
        offset += 4;
        // pets array
        for (const pet of this.pets) {
            buffer.writeUInt32BE(pet.catchTime, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.id, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.level, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.exp, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.currentLvExp, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.nextLvExp, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.maxHp, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.attack, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.defence, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.sa, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.sd, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.sp, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.ev_hp, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.ev_a, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.ev_d, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.ev_sa, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.ev_sd, offset);
            offset += 4;
            buffer.writeUInt32BE(pet.ev_sp, offset);
            offset += 4;
        }
        return buffer;
    }
    deserialize(buffer) {
        // Not needed for response proto
    }
}
exports.NoteUpdatePropRspProto = NoteUpdatePropRspProto;
//# sourceMappingURL=NoteUpdatePropRspProto.js.map