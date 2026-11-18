import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 低血秒杀先制 (2023)
 * 自身体力降到N%以下时，先制+6且每次攻击必定秒杀对方
 * effectArgs: [thresholdHigh, thresholdLow]
 */
export declare class LowHpOhkoPriorityPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=LowHpOhkoPriorityPassive.d.ts.map