import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 受特攻提升能力 (2012)
 * 受到特殊攻击时使自身的一种battle_lv提升1个等级，可提升n次
 * effectArgs: [statIndex, maxTimes]
 */
export declare class OnSpHitStatUpPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 受特攻降对方能力 (2034)
 * 受到特殊攻击时有n%几率使对方battle_lv降低1个等级
 * effectArgs: [statIndex, chance]
 */
export declare class OnSpHitEnemyStatDownPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 受击自身提升能力 (2035)
 * 受到任何攻击时有n%几率使自身battle_lv提升1个等级
 * effectArgs: [statIndex, chance]
 */
export declare class OnHitSelfStatUpPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=OnHitStatChangePassives.d.ts.map