import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
export declare const ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX = "on_hit_multi_stat_change_";
interface IStatChange {
    stat: number;
    change: number;
}
interface IOnHitMultiStatChangeParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'on_hit_multi_stat_change';
    duration?: number;
    statChanges?: IStatChange[];
}
export declare class OnHitMultiStatChangeEffect extends BaseAtomicEffect {
    private readonly duration;
    constructor(params: IOnHitMultiStatChangeParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
export {};
//# sourceMappingURL=OnHitMultiStatChangeEffect.d.ts.map