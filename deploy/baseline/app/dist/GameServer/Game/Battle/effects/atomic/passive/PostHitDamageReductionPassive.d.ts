import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 受击后减伤 (2049)
 * 受到物理攻击或特殊攻击后，下n回合受物理攻击或特殊攻击伤害减免m%
 * effectArgs: [duration, reducePercent]
 */
export declare class PostHitDamageReductionPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=PostHitDamageReductionPassive.d.ts.map