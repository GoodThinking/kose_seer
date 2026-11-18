import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
/**
 * 固定伤害减免参数接口
 */
export interface IFixedDamageReductionParams {
    /** 持续回合数 */
    duration?: number;
    /** 减免值 */
    reduction?: number;
}
/**
 * 固定伤害减免原子效果
 *
 * 持续N回合，每回合受到的伤害减少固定值
 *
 * @category Special
 */
export declare class FixedDamageReduction extends BaseAtomicEffect {
    private duration;
    private reduction;
    constructor(params: IFixedDamageReductionParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=FixedDamageReduction.d.ts.map