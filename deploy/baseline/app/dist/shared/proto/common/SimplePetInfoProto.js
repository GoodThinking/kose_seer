"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimplePetInfoProto = void 0;
const BaseProto_1 = require("../base/BaseProto");
const utils_1 = require("../../utils");
/**
 * 简单精灵信息
 * 用于 NOTE_READY_TO_FIGHT (2503) 中的精灵信息
 */
class SimplePetInfoProto extends BaseProto_1.BaseProto {
    petId = 0; // 精灵ID
    level = 0; // 等级
    hp = 0; // 当前HP
    maxHp = 0; // 最大HP
    skills = []; // 技能列表 (最多4个)
    catchTime = 0; // 捕获时间
    catchMap = 0; // 捕获地图
    catchRect = 0; // 捕获区域
    catchLevel = 0; // 捕获等级
    skinID = 0; // 皮肤ID
    shiny = 0; // 异色方案ID（0=普通）
    constructor() {
        super(0);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(200);
        writer.WriteUInt32(this.petId);
        writer.WriteUInt32(this.level);
        writer.WriteUInt32(this.hp);
        writer.WriteUInt32(this.maxHp);
        // 技能数量
        const validSkills = this.skills.filter(s => s.id > 0);
        writer.WriteUInt32(validSkills.length);
        // 写入4个技能槽（不足的补0）
        for (let i = 0; i < 4; i++) {
            const skill = validSkills[i] || { id: 0, pp: 0 };
            writer.WriteUInt32(skill.id);
            writer.WriteUInt32(skill.pp);
        }
        writer.WriteUInt32(this.catchTime);
        writer.WriteUInt32(this.catchMap);
        writer.WriteUInt32(this.catchRect);
        writer.WriteUInt32(this.catchLevel);
        writer.WriteUInt32(this.skinID);
        if (protocol === 'xin-20261013') {
            writer.WriteUInt32(this.shiny);
            // No verified KOSE mapping for freeForbidden, boss, ornament,
            // skillProton, skillProtonCount,
            // abilityMark, skillMark, commonMark, commonMarkActived.
            for (let i = 0; i < 9; i++)
                writer.WriteUInt32(0);
        }
        return writer.ToBuffer();
    }
    // 链式调用
    setPetId(value) {
        this.petId = value;
        return this;
    }
    setLevel(value) {
        this.level = value;
        return this;
    }
    setHP(hp, maxHp) {
        this.hp = hp;
        this.maxHp = maxHp;
        return this;
    }
    setSkills(skills) {
        this.skills = skills.slice(0, 4); // 最多4个技能
        return this;
    }
    setCatchTime(value) {
        this.catchTime = value;
        return this;
    }
    setCatchMap(value) {
        this.catchMap = value;
        return this;
    }
    setCatchLevel(value) {
        this.catchLevel = value;
        return this;
    }
    setSkinID(value) {
        this.skinID = value;
        return this;
    }
    setShiny(value) {
        this.shiny = value;
        return this;
    }
}
exports.SimplePetInfoProto = SimplePetInfoProto;
//# sourceMappingURL=SimplePetInfoProto.js.map