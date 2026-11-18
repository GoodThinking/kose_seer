import { BaseAtomicEffect } from './BaseAtomicEffect';
import { IDurationParams, IAtomicEffect } from './IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 持续效果包装器
 * 将其他原子效果包装成持续N回合的效果
 */
export declare class DurationWrapper extends BaseAtomicEffect {
    private params;
    private wrappedEffect;
    constructor(params: IDurationParams);
    setWrappedEffect(effect: IAtomicEffect): void;
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
//# sourceMappingURL=DurationWrapper.d.ts.map