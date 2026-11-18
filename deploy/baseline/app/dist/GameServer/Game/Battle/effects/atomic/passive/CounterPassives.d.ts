import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 天敌害怕 (2014)
 * 若遇到天敌，则战斗开始时连续害怕n回合
 * effectArgs: [fearTurns]
 * 天敌判定：对方属性克制自身属性
 */
export declare class CounterFearPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 天敌伤害减少 (2015)
 * 若遇到天敌，则整个战斗中对天敌的伤害减少n%
 * effectArgs: [reducePercent]
 */
export declare class CounterDamageReducePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 天敌先制降低 (2043)
 * 遇到天敌自身所有技能先制减少n
 * effectArgs: [priorityReduce]
 */
export declare class CounterPriorityReducePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=CounterPassives.d.ts.map