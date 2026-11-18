import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 性别伤害加成 (2069)
 * 目标为n性别时，所有攻击伤害增加m%
 * effectArgs: [gender, bonusPercent]
 */
export declare class GenderDamageBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=GenderDamageBonusPassive.d.ts.map