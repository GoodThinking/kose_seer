import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 特定系吸收 (2068)
 * 受到特定系的攻击会恢复自身相应体力
 * effectArgs: [elementType]
 */
export declare class SpecificTypeAbsorbPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=SpecificTypeAbsorbPassive.d.ts.map