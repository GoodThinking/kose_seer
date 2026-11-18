import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 低血概率回满 (2033)
 * 精灵体力降低到1/n时有m%几率体力回满
 * effectArgs: [hpFraction, chance]
 */
export declare class LowHpFullHealChancePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=LowHpFullHealChancePassive.d.ts.map