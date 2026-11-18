import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 闪避提升 (2007)
 * 任何技能对自身的命中率下降n%
 * effectArgs: [reducePercent]
 */
export declare class AccuracyReductionPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 技能闪避 (2024)
 * 对方用这些技能时，对自身的命中率为0
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export declare class SkillDodgePassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 命中率提升 (2029)
 * 自身的所有技能命中率增加n%
 * effectArgs: [bonusPercent]
 */
export declare class AccuracyBonusPassive extends BaseAtomicEffect {
    constructor(params?: any);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=AccuracyPassives.d.ts.map