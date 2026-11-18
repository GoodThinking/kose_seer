"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoteStartFight = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoteStartFightRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/NoteStartFightRspProto");
/**
 * 开始战斗通知包
 * CMD 2504
 */
class PacketNoteStartFight extends BaseProto_1.BaseProto {
    _data;
    constructor(isCanAuto, playerPet, enemyPet) {
        super(CommandID_1.CommandID.NOTE_START_FIGHT);
        const proto = new NoteStartFightRspProto_1.NoteStartFightRspProto();
        proto.setIsCanAuto(isCanAuto);
        proto.setPlayerPet(playerPet);
        proto.setEnemyPet(enemyPet);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoteStartFight = PacketNoteStartFight;
//# sourceMappingURL=PacketNoteStartFight.js.map