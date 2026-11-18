"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttackValueProto = void 0;
const BaseProto_1 = require("../base/BaseProto");
const utils_1 = require("../../utils");
/**
 * 攻击结果信息
 * 对应前端: com.robot.core.info.fightInfo.attack.AttackValue
 * 用于 NOTE_USE_SKILL (2505) 中的攻击信息
 *
 * 重要说明：
 * - userId: 攻击者ID
 * - lostHP: 被攻击者失去的HP（伤害值）
 * - gainHP: 攻击者获得的HP（吸血等效果，可为负数表示反伤）
 * - remainHp: 攻击者剩余HP（客户端用此字段更新攻击者的HP条）
 * - maxHp: 攻击者的最大HP
 * - skillList: 攻击者的技能列表
 *
 * 客户端逻辑：
 * - LOST_HP 事件：更新被攻击者（enemy）的HP，扣除 lostHP
 * - GAIN_HP 事件：更新攻击者（this）的HP，增加 gainHP
 * - REMAIN_HP 事件：更新攻击者（this）的HP，设置为 remainHp
 * - 客户端计算 changeHp = remainHp - currentHp 来显示HP变化动画
 * - 如果 gainHP != 0，客户端会在攻击者身上显示回血/反伤动画
 */
class AttackValueProto extends BaseProto_1.BaseProto {
    userId = 0; // 攻击者ID
    skillId = 0; // 技能ID
    atkTimes = 1; // 攻击次数
    lostHP = 0; // 被攻击者损失的HP（伤害值）
    gainHP = 0; // 攻击者回复的HP（吸血等，可为负数表示反伤）
    remainHp = 0; // 攻击者剩余HP（客户端用于更新攻击者HP条）
    maxHp = 0; // 攻击者最大HP
    state = 0; // 状态 (0=正常, 1=未命中/格挡)
    skillList = []; // 攻击者技能列表
    isCrit = 0; // 是否暴击 (0/1)
    status = new Array(20).fill(0); // 攻击者状态数组 (20字节)
    battleLv = new Array(6).fill(0); // 攻击者战斗等级 (6字节)
    maxShield = 0; // 最大护盾
    curShield = 0; // 当前护盾
    petType = 0; // 精灵类型
    constructor() {
        super(0);
    }
    serialize(protocol = 'kose') {
        const writer = new utils_1.BufferWriter(300);
        writer.WriteUInt32(this.userId);
        writer.WriteUInt32(this.skillId);
        writer.WriteUInt32(this.atkTimes);
        writer.WriteUInt32(this.lostHP);
        writer.WriteInt32(this.gainHP); // 有符号
        writer.WriteInt32(this.remainHp); // 有符号
        writer.WriteUInt32(this.maxHp);
        writer.WriteUInt32(this.state);
        // 技能列表
        writer.WriteUInt32(this.skillList.length);
        for (const skill of this.skillList) {
            writer.WriteUInt32(skill.id);
            writer.WriteUInt32(skill.pp);
        }
        writer.WriteUInt32(this.isCrit);
        // XIN AttackValue reads 50 signed bytes; KOSE retains its original 20.
        const statusCount = protocol === 'xin-20261013' ? 50 : 20;
        for (let i = 0; i < statusCount; i++) {
            if (protocol === 'xin-20261013') {
                writer.WriteInt8(this.status[i] ?? 0);
            }
            else {
                writer.WriteUInt8(this.status[i] || 0);
            }
        }
        // 战斗等级 (6字节) - 使用有符号字节匹配Lua端
        for (let i = 0; i < 6; i++) {
            writer.WriteInt8(this.battleLv[i] || 0);
        }
        if (protocol === 'kose') {
            writer.WriteUInt32(this.maxShield);
            writer.WriteUInt32(this.curShield);
            writer.WriteUInt32(this.petType);
        }
        return writer.ToBuffer();
    }
    // 链式调用
    setUserId(value) {
        this.userId = value;
        return this;
    }
    setSkillId(value) {
        this.skillId = value;
        return this;
    }
    setAtkTimes(value) {
        this.atkTimes = value;
        return this;
    }
    setDamage(lostHP) {
        this.lostHP = lostHP;
        return this;
    }
    setGainHP(value) {
        this.gainHP = value;
        return this;
    }
    setRemainHp(value) {
        this.remainHp = value;
        return this;
    }
    setMaxHp(value) {
        this.maxHp = value;
        return this;
    }
    setState(value) {
        this.state = value;
        return this;
    }
    setSkillList(skills) {
        this.skillList = skills;
        return this;
    }
    setIsCrit(value) {
        this.isCrit = value;
        return this;
    }
    setStatus(value) {
        this.status = value;
        return this;
    }
    setBattleLv(value) {
        this.battleLv = value;
        return this;
    }
    setPetType(value) {
        this.petType = value;
        return this;
    }
}
exports.AttackValueProto = AttackValueProto;
//# sourceMappingURL=AttackValueProto.js.map