import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 高伤反杀 (2037)
 * 自身一次受到大于n的伤害时直接将对方体力降至0
 * effectArgs: [thresholdHigh, thresholdLow]
 */
export declare class HighDamageCounterKillPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=HighDamageCounterKillPassive.d.ts.map