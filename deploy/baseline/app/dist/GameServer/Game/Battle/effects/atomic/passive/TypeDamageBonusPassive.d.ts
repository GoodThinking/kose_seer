import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 属性伤害加成 (2028)
 * XX系技能伤害增加n%
 * effectArgs: [elementType, bonusPercent]
 */
export declare class TypeDamageBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=TypeDamageBonusPassive.d.ts.map