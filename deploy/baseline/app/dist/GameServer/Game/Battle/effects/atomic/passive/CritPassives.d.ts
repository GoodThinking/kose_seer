import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 固定会心率 (2008)
 * 自身的会心一击率为n/16
 * effectArgs: [critNumerator]
 */
export declare class FixedCritRatePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 会心率提升 (2030)
 * 所有技能的致命一击率增加n/16
 * effectArgs: [critBonus]
 */
export declare class CritRateBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 固定致命率 (2045)
 * 自身所有技能致命一击率固定是1/n
 * effectArgs: [critDivisor]
 */
export declare class FixedCritDivisorPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 异常状态暴击 (2057)
 * 如果对方存在某异常状态，则自己攻击的致命一击率提高n/16
 * effectArgs: [statusType, critBonus]
 */
export declare class StatusCritBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 致命率降低 (2064)
 * 受到致命一击的概率降低n/16
 * effectArgs: [critReduce]
 */
export declare class CritRateReducePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=CritPassives.d.ts.map