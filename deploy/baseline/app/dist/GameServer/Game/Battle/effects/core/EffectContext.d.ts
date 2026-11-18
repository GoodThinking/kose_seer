import { IBattlePet } from '../../../../../shared/models/BattleModel';
/**
 * 效果触发时机
 */
export declare enum EffectTiming {
    BATTLE_START = "BATTLE_START",
    TURN_START = "TURN_START",
    BEFORE_SKILL = "BEFORE_SKILL",
    BEFORE_SPEED_CHECK = "BEFORE_SPEED_CHECK",
    BEFORE_HIT_CHECK = "BEFORE_HIT_CHECK",
    BEFORE_CRIT_CHECK = "BEFORE_CRIT_CHECK",
    BEFORE_DAMAGE_CALC = "BEFORE_DAMAGE_CALC",
    AFTER_DAMAGE_CALC = "AFTER_DAMAGE_CALC",
    HIT_CHECK = "HIT_CHECK",
    CRIT_CHECK = "CRIT_CHECK",
    BEFORE_DAMAGE_APPLY = "BEFORE_DAMAGE_APPLY",
    AFTER_DAMAGE_APPLY = "AFTER_DAMAGE_APPLY",
    AFTER_SKILL = "AFTER_SKILL",
    AFTER_HIT_CHECK = "AFTER_HIT_CHECK",
    AFTER_KO = "AFTER_KO",
    TURN_END = "TURN_END",
    BATTLE_END = "BATTLE_END",
    ON_HP_CHANGE = "ON_HP_CHANGE",
    ON_ATTACKED = "ON_ATTACKED",
    ON_ATTACK = "ON_ATTACK",
    ON_KO = "ON_KO",
    ON_RECEIVE_DAMAGE = "ON_RECEIVE_DAMAGE",
    ON_EVADE = "ON_EVADE",
    ATTACK_START = "ATTACK_START",
    ON_HIT = "ON_HIT",
    SKILL_EFFECT = "SKILL_EFFECT",
    ATTACK_END = "ATTACK_END",
    AFTER_ATTACK_END = "AFTER_ATTACK_END"
}
/**
 * 效果上下文
 * 包含效果执行所需的所有信息
 */
export interface IEffectContext {
    attacker: IBattlePet;
    defender: IBattlePet;
    skillId: number;
    skillType: number;
    skillCategory: number;
    skillPower: number;
    damage: number;
    originalDamage: number;
    turn: number;
    timing: EffectTiming;
    effectId: number;
    effectArgs: number[];
    results: IEffectResult[];
    isCrit: boolean;
    isMiss: boolean;
    isBlocked: boolean;
    damageMultiplier: number;
    hitRateModifier: number;
    critRateModifier: number;
    priorityModifier: number;
    mustHit?: boolean;
    alwaysFirst?: boolean;
    instantKill?: boolean;
    critRateBonus?: number;
    effectData?: any;
    skill?: {
        power: number;
        accuracy: number;
        priority: number;
    };
    critRate?: number;
}
/**
 * 效果结果
 */
export interface IEffectResult {
    effectId: number;
    effectName: string;
    success: boolean;
    target: 'attacker' | 'defender' | 'both';
    type: string;
    effectType?: string;
    value?: number;
    message: string;
    data?: any;
}
/**
 * 创建效果上下文
 */
export declare function createEffectContext(attacker: IBattlePet, defender: IBattlePet, skillId: number, damage?: number, timing?: EffectTiming): IEffectContext;
//# sourceMappingURL=EffectContext.d.ts.map