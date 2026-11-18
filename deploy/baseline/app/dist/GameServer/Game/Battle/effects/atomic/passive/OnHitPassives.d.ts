import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 低伤回血 (2072)
 * 受到的伤害低于n时，则在受到伤害后恢复自身n点体力值
 * effectArgs: [threshold]
 */
export declare class LowDamageHealPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 伤害吸血 (2073)
 * 给对方造成的伤害会恢复自身n%体力
 * effectArgs: [healPercent]
 */
export declare class DamageLifestealPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 命中叠衰弱 (2074)
 * 每次物理或特殊攻击命中对手后，有百分之n的概率给对手叠加一层衰弱
 * effectArgs: [chance]
 */
export declare class HitStackWeaknessPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 高伤下招翻倍 (2079)
 * 受到超过n的伤害时，下一招威力翻倍
 * effectArgs: [threshold]
 */
export declare class HighDamageNextDoublePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 高伤回血 (2080)
 * 受到超过n的伤害时，恢复m体力
 * effectArgs: [threshold, healAmount]
 */
export declare class HighDamageHealPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 低血守护 (2081)
 * 体力低于n%时，每次受到伤害都会使自身进入山神守护状态，接下来m回合受到伤害减免90%
 * effectArgs: [hpPercent, duration]
 */
export declare class LowHpGuardianPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=OnHitPassives.d.ts.map