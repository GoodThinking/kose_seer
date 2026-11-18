"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetInfoProto = void 0;
const BaseProto_1 = require("../base/BaseProto");
const utils_1 = require("../../utils");
/**
 * 精灵信息Proto（完整版）
 * 对应前端: com.robot.core.info.pet.PetInfo (isDefault/param2 = true)
 */
class PetInfoProto extends BaseProto_1.BaseProto {
    id = 0; // 精灵ID
    name = ''; // 精灵名称
    dv = 31; // 个体值
    nature = 0; // 性格
    level = 1; // 等级
    exp = 0; // 当前经验
    lvExp = 0; // 本级经验
    nextLvExp = 0; // 下级所需经验
    hp = 100; // 当前HP
    maxHp = 100; // 最大HP
    attack = 50; // 攻击
    defence = 50; // 防御
    s_a = 50; // 特攻
    s_d = 50; // 特防
    speed = 50; // 速度
    ev_hp = 0; // 努力值HP
    ev_attack = 0; // 努力值攻击
    ev_defence = 0; // 努力值防御
    ev_sa = 0; // 努力值特攻
    ev_sd = 0; // 努力值特防
    ev_sp = 0; // 努力值速度
    skills = []; // 技能列表（最多4个）
    catchTime = 0; // 捕获时间（唯一标识）
    catchMap = 0; // 捕获地图
    catchRect = 0; // 捕获区域
    catchLevel = 1; // 捕获等级
    effects = []; // 效果列表
    skinID = 0; // 皮肤ID
    // XIN extensions without a KOSE gameplay source remain unset.
    abilityType = 0;
    addMaxHP = 0;
    addMoreMaxHP = 0;
    addAttack = 0;
    addDefence = 0;
    addSA = 0;
    addSD = 0;
    addSpeed = 0;
    peteffect = 0;
    shiny = 0;
    constructor() {
        super(0);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(256);
        // 1. 基础信息
        writer.WriteUInt32(this.id);
        writer.WriteBytes(this.buildString(this.name, 16));
        writer.WriteUInt32(this.dv);
        writer.WriteUInt32(this.nature);
        if (protocol === 'xin-20261013')
            writer.WriteUInt32(this.abilityType);
        writer.WriteUInt32(this.level);
        writer.WriteUInt32(this.exp);
        writer.WriteUInt32(this.lvExp);
        writer.WriteUInt32(this.nextLvExp);
        // 2. 战斗属性
        writer.WriteUInt32(this.hp);
        writer.WriteUInt32(this.maxHp);
        writer.WriteUInt32(this.attack);
        writer.WriteUInt32(this.defence);
        writer.WriteUInt32(this.s_a);
        writer.WriteUInt32(this.s_d);
        writer.WriteUInt32(this.speed);
        if (protocol === 'xin-20261013') {
            for (const value of [this.addMaxHP, this.addMoreMaxHP, this.addAttack,
                this.addDefence, this.addSA, this.addSD, this.addSpeed])
                writer.WriteUInt32(value);
        }
        // 3. 努力值
        writer.WriteUInt32(this.ev_hp);
        writer.WriteUInt32(this.ev_attack);
        writer.WriteUInt32(this.ev_defence);
        writer.WriteUInt32(this.ev_sa);
        writer.WriteUInt32(this.ev_sd);
        writer.WriteUInt32(this.ev_sp);
        // 4. 技能列表（固定4个槽位）
        const validSkills = this.skills.filter(s => s.id > 0);
        writer.WriteUInt32(validSkills.length);
        for (let i = 0; i < 4; i++) {
            const skill = this.skills[i] || { id: 0, pp: 0 };
            writer.WriteUInt32(skill.id);
            writer.WriteUInt32(skill.pp);
        }
        // 5. 捕获信息
        writer.WriteUInt32(this.catchTime);
        writer.WriteUInt32(this.catchMap);
        writer.WriteUInt32(this.catchRect);
        writer.WriteUInt32(this.catchLevel);
        // 6. 效果列表
        writer.WriteUInt16(this.effects.length);
        for (const effect of this.effects) {
            writer.WriteUInt32(effect.itemId); // 4 bytes
            writer.WriteUInt8(effect.status); // 1 byte
            writer.WriteUInt8(effect.leftCount); // 1 byte
            writer.WriteUInt16(effect.effectID); // 2 bytes
            if (protocol === 'xin-20261013') {
                const args = effect.args ?? [effect.arg1, effect.arg2];
                const data = Buffer.alloc(16);
                for (let i = 0; i < 8; i++)
                    data.writeUInt16LE(args[i] ?? 0, i * 2);
                writer.WriteBytes(data);
                continue;
            }
            writer.WriteUInt8(effect.arg1); // 1 byte
            writer.WriteUInt8(0); // 1 byte (unused)
            writer.WriteUInt8(effect.arg2); // 1 byte
            // 13 bytes padding (total 24 bytes per effect)
            for (let p = 0; p < 13; p++) {
                writer.WriteUInt8(0);
            }
        }
        if (protocol === 'xin-20261013')
            writer.WriteUInt32(this.peteffect);
        // 7. 皮肤
        writer.WriteUInt32(this.skinID);
        if (protocol === 'xin-20261013') {
            writer.WriteUInt32(this.shiny);
            // freeForbidden, boss, ornament, skillProton, skillProtonCount, four marks
            writer.WriteBytes(Buffer.alloc(9 * 4));
        }
        return writer.ToBuffer();
    }
}
exports.PetInfoProto = PetInfoProto;
//# sourceMappingURL=PetInfoProto.js.map