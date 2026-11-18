import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 受击伤害倍增 (2022)
 * 被打时受到直接攻击伤害提高至n倍
 * effectArgs: [multiplier]
 */
export declare class ReceivedDamageMultiplyPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=ReceivedDamageMultiplyPassive.d.ts.map