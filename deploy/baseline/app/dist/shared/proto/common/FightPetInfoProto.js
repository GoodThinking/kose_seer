"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FightPetInfoProto = void 0;
const BaseProto_1 = require("../base/BaseProto");
const utils_1 = require("../../utils");
/**
 * 战斗精灵信息
 * 对应前端: com.robot.core.info.fightInfo.FightPetInfo
 * 用于战斗开始时的精灵信息
 */
class FightPetInfoProto extends BaseProto_1.BaseProto {
    userID = 0; // 用户ID (0=敌人)
    petID = 0; // 精灵ID
    petName = ''; // 精灵名称 (16字节)
    catchTime = 0; // 捕获时间
    hp = 0; // 当前HP
    maxHP = 0; // 最大HP
    level = 0; // 等级
    catchable = 0; // 是否可捕获 (0/1)
    battleLv = [0, 0, 0, 0, 0, 0]; // 战斗等级 (6字节)
    constructor() {
        super(0);
    }
    serialize() {
        const writer = new utils_1.BufferWriter(100);
        writer.WriteUInt32(this.userID);
        writer.WriteUInt32(this.petID);
        writer.WriteBytes(this.buildString(this.petName, 16));
        writer.WriteUInt32(this.catchTime);
        writer.WriteUInt32(this.hp);
        writer.WriteUInt32(this.maxHP);
        writer.WriteUInt32(this.level);
        writer.WriteUInt32(this.catchable);
        // battleLv (6字节)
        for (let i = 0; i < 6; i++) {
            writer.WriteUInt8(this.battleLv[i] || 0);
        }
        return writer.ToBuffer();
    }
    // 链式调用
    setUserID(value) {
        this.userID = value;
        return this;
    }
    setPetID(value) {
        this.petID = value;
        return this;
    }
    setPetName(value) {
        this.petName = value;
        return this;
    }
    setCatchTime(value) {
        this.catchTime = value;
        return this;
    }
    setHP(hp, maxHP) {
        this.hp = hp;
        this.maxHP = maxHP;
        return this;
    }
    setLevel(value) {
        this.level = value;
        return this;
    }
    setCatchable(value) {
        this.catchable = value;
        return this;
    }
    setBattleLv(value) {
        this.battleLv = value;
        return this;
    }
}
exports.FightPetInfoProto = FightPetInfoProto;
//# sourceMappingURL=FightPetInfoProto.js.map