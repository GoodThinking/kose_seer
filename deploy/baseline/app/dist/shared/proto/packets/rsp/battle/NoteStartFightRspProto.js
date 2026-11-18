"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteStartFightRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
const FightPetInfoProto_1 = require("../../../common/FightPetInfoProto");
/**
 * [CMD: 2504 NOTE_START_FIGHT] 开始战斗通知响应
 * 发送战斗开始信息
 */
class NoteStartFightRspProto extends BaseProto_1.BaseProto {
    isCanAuto = 0; // 是否可以自动战斗
    playerPet;
    enemyPet;
    constructor() {
        super(CommandID_1.CommandID.NOTE_START_FIGHT);
        this.playerPet = new FightPetInfoProto_1.FightPetInfoProto();
        this.enemyPet = new FightPetInfoProto_1.FightPetInfoProto();
    }
    serialize() {
        const writer = new utils_1.BufferWriter(512);
        writer.WriteUInt32(this.isCanAuto);
        writer.WriteBytes(this.playerPet.serialize());
        writer.WriteBytes(this.enemyPet.serialize());
        return writer.ToBuffer();
    }
    // 链式调用
    setIsCanAuto(value) {
        this.isCanAuto = value;
        return this;
    }
    setPlayerPet(pet) {
        this.playerPet = pet;
        return this;
    }
    setEnemyPet(pet) {
        this.enemyPet = pet;
        return this;
    }
}
exports.NoteStartFightRspProto = NoteStartFightRspProto;
//# sourceMappingURL=NoteStartFightRspProto.js.map