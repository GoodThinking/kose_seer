import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 每回合回血 (2041)
 * 每回合恢复自身n点体力
 * effectArgs: [healAmount]
 */
export declare class TurnEndHealPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 双方回血 (2053)
 * 敌我双方每回合恢复n%HP
 * effectArgs: [healPercent]
 */
export declare class BothTurnHealPercentPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 双方扣血 (2054)
 * 每回合结束后，敌我双方扣除n体力值
 * effectArgs: [damageAmount]
 */
export declare class BothTurnDamagePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 回合吸血 (2071)
 * 每回合结束时，对手降低n体力，自身恢复m体力
 * effectArgs: [enemyDamage, selfHeal]
 */
export declare class TurnDrainPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 差异回血 (2075)
 * 每回合敌方恢复m%HP，我方恢复n%HP
 * effectArgs: [enemyHealPercent, selfHealPercent]
 */
export declare class AsymmetricTurnHealPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 每回合扣敌血 (2077)
 * 每回合损失对手n点体力
 * effectArgs: [damageAmount]
 */
export declare class TurnEnemyDamagePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=TurnHealPassives.d.ts.map