import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 先制变化 (2042)
 * 自身所有技能先制改变n(+/-)
 * effectArgs: [priorityChange]
 */
export declare class PriorityChangePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 低血必先手 (2097)
 * 体力低于n%时，必定先手
 * effectArgs: [hpPercent]
 */
export declare class LowHpPriorityPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 高伤下回合先手 (2098)
 * 受到超过n的伤害时，下回合必定先出手
 * effectArgs: [threshold]
 */
export declare class HighDamageNextPriorityPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=PriorityPassives.d.ts.map