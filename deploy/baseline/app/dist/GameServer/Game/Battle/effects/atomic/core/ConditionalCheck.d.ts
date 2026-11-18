import { BaseAtomicEffect } from './BaseAtomicEffect';
import { IConditionalParams } from './IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 条件判断原子效果
 * 根据条件判断执行不同的效果
 */
export declare class ConditionalCheck extends BaseAtomicEffect {
    private params;
    private thenEffects;
    private elseEffects;
    constructor(params: IConditionalParams);
    execute(context: IEffectContext): IEffectResult[];
    private checkCondition;
    validate(params: any): boolean;
}
//# sourceMappingURL=ConditionalCheck.d.ts.map