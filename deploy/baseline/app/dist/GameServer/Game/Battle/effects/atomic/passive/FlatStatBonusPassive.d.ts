import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 固定属性加成 (2026)
 * 给一种battle_attr增加固定n点属性值
 * effectArgs: [attrType, value]
 * attrType: 0=attack, 1=defence, 2=spAtk, 3=spDef, 4=speed
 */
export declare class FlatStatBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=FlatStatBonusPassive.d.ts.map