import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 濒死回满 (2009)
 * 如果被打到BurstRecoverHP以下且没有挂掉则马上恢复到满HP
 * effectArgs: [burstHpHigh, burstHpLow] (组合为32位阈值)
 */
export declare class BurstRecoverFullHpPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 濒死回满含PP (2051)
 * 如果被打到BurstRecoverHP以下且没有挂掉则马上恢复到满HP和PP值
 * effectArgs: [burstHpHigh, burstHpLow]
 */
export declare class BurstRecoverFullHpPpPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=BurstRecoverPassives.d.ts.map