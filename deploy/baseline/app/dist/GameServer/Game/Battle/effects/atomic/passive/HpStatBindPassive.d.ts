import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 血量绑定能力 (2016)
 * HP与battle_lv的某一种绑定，自身体力每减少1/8则该battle_lv上升1个等级，最高到12
 * effectArgs: [statIndex]
 */
export declare class HpStatBindPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=HpStatBindPassive.d.ts.map