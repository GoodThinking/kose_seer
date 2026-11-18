"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FightNpcMonsterReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * 挑战野外精灵请求
 * CMD 2408
 */
class FightNpcMonsterReqProto extends BaseProto_1.BaseProto {
    monsterIndex = 0; // 怪物索引 (0-8)
    constructor() {
        super(CommandID_1.CommandID.FIGHT_NPC_MONSTER);
    }
    deserialize(buffer) {
        let offset = 0;
        if (buffer.length >= 4) {
            this.monsterIndex = buffer.readUInt32BE(offset);
            offset += 4;
        }
    }
    serialize() {
        return Buffer.alloc(0); // Request usually doesn't need serialize
    }
}
exports.FightNpcMonsterReqProto = FightNpcMonsterReqProto;
//# sourceMappingURL=FightNpcMonsterReqProto.js.map