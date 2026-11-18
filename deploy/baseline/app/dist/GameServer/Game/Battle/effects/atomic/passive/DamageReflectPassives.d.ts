import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 伤害反弹 (2011)
 * 受到任何攻击都会反弹1/n的伤害给对方
 * effectArgs: [divisor]
 */
export declare class DamageReflectFractionPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 高伤反弹 (2083)
 * 受到超过n的伤害时，反弹m%伤害
 * effectArgs: [threshold, reflectPercent]
 */
export declare class HighDamageReflectPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=DamageReflectPassives.d.ts.map