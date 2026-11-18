import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 伤害增加 (2038)
 * 自身造成的伤害增加n%
 * effectArgs: [bonusPercent]
 */
export declare class DamageBonusPercentPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 偶数伤害倍增 (2039)
 * 偶数伤害提升到n*dmg
 * effectArgs: [multiplier]
 */
export declare class EvenDamageMultiplyPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 奇数伤害削减 (2040)
 * 奇数伤害改为1/n*dmg
 * effectArgs: [divisor]
 */
export declare class OddDamageDividePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 双方伤害降低 (2047)
 * 敌我双方伤害降低n%
 * effectArgs: [reducePercent]
 */
export declare class BothDamageReducePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 双方伤害倍增 (2055)
 * 每回合敌我双方造成的伤害为原来的n倍
 * effectArgs: [multiplier]
 */
export declare class BothDamageMultiplyPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 概率减伤 (2060)
 * 受到攻击时n%几率使受到的伤害降低m点
 * effectArgs: [chance, reduceAmount]
 */
export declare class ChanceDamageFlatReducePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 概率完全抵挡 (2061)
 * n%几率完全抵挡一次伤害
 * effectArgs: [chance]
 */
export declare class ChanceFullBlockPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 物攻概率加伤 (2062)
 * 物理攻击有n%几率使伤害提高m点
 * effectArgs: [chance, bonusAmount]
 */
export declare class PhysChanceDamageBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 特攻概率加伤 (2063)
 * 特殊攻击有n%几率使伤害提高m点
 * effectArgs: [chance, bonusAmount]
 */
export declare class SpChanceDamageBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 物攻或特攻加伤 (2065)
 * 物理攻击或特殊攻击伤害增加m%
 * effectArgs: [attackType, bonusPercent] (attackType: 1=物理, 3=特殊)
 */
export declare class AttackTypeDamageBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 自身伤害削减 (2076)
 * 减少自身n%的攻击伤害
 * effectArgs: [reducePercent]
 */
export declare class SelfDamageReducePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=DamageModifyPassives.d.ts.map