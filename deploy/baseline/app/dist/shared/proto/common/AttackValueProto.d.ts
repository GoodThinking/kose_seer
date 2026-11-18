import { BaseProto } from '../base/BaseProto';
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
export declare class AttackValueProto extends BaseProto {
    userId: number;
    skillId: number;
    atkTimes: number;
    lostHP: number;
    gainHP: number;
    remainHp: number;
    maxHp: number;
    state: number;
    skillList: Array<{
        id: number;
        pp: number;
    }>;
    isCrit: number;
    status: number[];
    battleLv: number[];
    maxShield: number;
    curShield: number;
    petType: number;
    constructor();
    serialize(): Buffer;
    setUserId(value: number): this;
    setSkillId(value: number): this;
    setAtkTimes(value: number): this;
    setDamage(lostHP: number): this;
    setGainHP(value: number): this;
    setRemainHp(value: number): this;
    setMaxHp(value: number): this;
    setState(value: number): this;
    setSkillList(skills: Array<{
        id: number;
        pp: number;
    }>): this;
    setIsCrit(value: number): this;
    setStatus(value: number[]): this;
    setBattleLv(value: number[]): this;
    setPetType(value: number): this;
}
//# sourceMappingURL=AttackValueProto.d.ts.map