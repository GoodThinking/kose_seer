"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteReadyToFightRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
const utils_1 = require("../../../../utils");
/**
 * [CMD: 2503 NOTE_READY_TO_FIGHT] 准备战斗通知响应
 * 发送双方的精灵信息
 */
class NoteReadyToFightRspProto extends BaseProto_1.BaseProto {
    // 玩家信息
    playerUserId = 0;
    playerNick = '';
    playerPets = [];
    // 敌人信息
    enemyUserId = 0;
    enemyNick = '';
    enemyPets = [];
    constructor() {
        super(CommandID_1.CommandID.NOTE_READY_TO_FIGHT);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(2048);
        // 战斗ID (客户端期望的第一个字段)
        writer.WriteUInt32(0);
        // 玩家信息
        writer.WriteUInt32(this.playerUserId);
        writer.WriteBytes(this.buildString(this.playerNick, 16));
        if (protocol === 'xin-20261013')
            writer.WriteBytes(Buffer.alloc(32));
        writer.WriteUInt32(this.playerPets.length);
        for (const pet of this.playerPets) {
            writer.WriteBytes(pet.serialize(protocol));
        }
        // 敌人信息
        writer.WriteUInt32(this.enemyUserId);
        writer.WriteBytes(this.buildString(this.enemyNick, 16));
        if (protocol === 'xin-20261013')
            writer.WriteBytes(Buffer.alloc(32));
        writer.WriteUInt32(this.enemyPets.length);
        for (const pet of this.enemyPets) {
            writer.WriteBytes(pet.serialize(protocol));
        }
        return writer.ToBuffer();
    }
    // 链式调用
    setPlayerInfo(userId, nick, pets) {
        this.playerUserId = userId;
        this.playerNick = nick;
        this.playerPets = pets;
        return this;
    }
    setEnemyInfo(userId, nick, pets) {
        this.enemyUserId = userId;
        this.enemyNick = nick;
        this.enemyPets = pets;
        return this;
    }
}
exports.NoteReadyToFightRspProto = NoteReadyToFightRspProto;
//# sourceMappingURL=NoteReadyToFightRspProto.js.map