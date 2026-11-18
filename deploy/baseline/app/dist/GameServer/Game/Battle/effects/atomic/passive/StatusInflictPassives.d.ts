import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 受击致异常 (2006)
 * 受到普通属性伤害时以n%的概率使对方进入异常状态
 * effectArgs: [statusType, chance]
 */
export declare class OnHitStatusInflictPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 物攻致异常 (2066)
 * 自身的物攻有n%几率使对方处于异常状态
 * effectArgs: [chance, statusType]
 */
export declare class PhysHitStatusInflictPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 特攻致异常 (2067)
 * 自身的特攻有n%几率使对方处于异常状态
 * effectArgs: [chance, statusType]
 */
export declare class SpHitStatusInflictPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 受特攻致异常 (2078)
 * 受到特殊攻击伤害时以n%的概率使对方进入异常状态
 * effectArgs: [statusType, chance]
 */
export declare class OnSpHitStatusInflictPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=StatusInflictPassives.d.ts.map