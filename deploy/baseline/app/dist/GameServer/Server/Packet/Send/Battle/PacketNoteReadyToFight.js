"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoteReadyToFight = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoteReadyToFightRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/NoteReadyToFightRspProto");
/**
 * 准备战斗通知包
 * CMD 2503
 */
class PacketNoteReadyToFight extends BaseProto_1.BaseProto {
    _data;
    constructor(playerUserId, playerNick, playerPets, enemyUserId, enemyNick, enemyPets, protocol = 'kose') {
        super(CommandID_1.CommandID.NOTE_READY_TO_FIGHT);
        const proto = new NoteReadyToFightRspProto_1.NoteReadyToFightRspProto();
        proto.setPlayerInfo(playerUserId, playerNick, playerPets);
        proto.setEnemyInfo(enemyUserId, enemyNick, enemyPets);
        this._data = proto.serialize(protocol);
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoteReadyToFight = PacketNoteReadyToFight;
//# sourceMappingURL=PacketNoteReadyToFight.js.map