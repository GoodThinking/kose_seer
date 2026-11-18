import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 定时秒杀 (2056)
 * 第n回合秒杀敌人
 * effectArgs: [turnNumber]
 */
export declare class TimedOhkoPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=TimedOhkoPassive.d.ts.map