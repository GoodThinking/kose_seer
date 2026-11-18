import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
export interface ISpecialParams {
    type: AtomicEffectType.SPECIAL;
    specialType: string;
    [key: string]: any;
}
export declare class SpecialEffect extends BaseAtomicEffect {
    private params;
    constructor(params: ISpecialParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
export interface IDrainAuraParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'drain_aura';
    drainPercent: number;
    duration?: number;
    affectAllAttacks?: boolean;
    maxDrain?: number;
}
export declare class DrainAura extends BaseAtomicEffect {
    private drainPercent;
    private duration?;
    private affectAllAttacks;
    private maxDrain;
    constructor(params: IDrainAuraParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    private getAuraState;
}
export interface IConditionalDrainAuraParams {
    duration: number;
    drainRatio: number;
    condition: 'first_strike' | 'hp_below' | 'stat_boosted';
    conditionValue?: number;
}
export declare class ConditionalDrainAura extends BaseAtomicEffect {
    private duration;
    private drainRatio;
    private condition;
    private conditionValue?;
    constructor(params: IConditionalDrainAuraParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    private checkCondition;
}
export interface IConditionalContinuousDamageParams {
    duration: number;
    damagePerTurn: number;
    condition: 'self_weakened' | 'target_boosted' | 'hp_below';
    conditionValue?: number;
}
export declare class ConditionalContinuousDamage extends BaseAtomicEffect {
    private duration;
    private damagePerTurn;
    private condition;
    private conditionValue?;
    constructor(params: IConditionalContinuousDamageParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    private checkCondition;
}
export interface IWeakenEffectParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'weaken';
    weakenType: 'damage' | 'heal' | 'all';
    ratio: number;
    duration?: number;
}
export declare class WeakenEffect extends BaseAtomicEffect {
    private weakenType;
    private ratio;
    private duration;
    constructor(params: IWeakenEffectParams);
    execute(context: IEffectContext): IEffectResult[];
    private isWeakened;
    private getWeakenState;
    validate(params: any): boolean;
}
export interface IClearTurnEffectsParams {
    target?: string;
}
export declare class ClearTurnEffects extends BaseAtomicEffect {
    private target;
    constructor(params: IClearTurnEffectsParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
export interface ITransformParams {
    duration?: number;
    copyStatStages?: boolean;
    copyHp?: boolean;
}
export declare class Transform extends BaseAtomicEffect {
    private duration;
    private copyStatStages;
    private copyHp;
    constructor(params: ITransformParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
export interface ISubstituteParams {
    hpPercent: number;
    canBeCrit?: boolean;
    canBeStatused?: boolean;
}
export declare class Substitute extends BaseAtomicEffect {
    private hpPercent;
    private canBeCrit;
    private canBeStatused;
    constructor(params: ISubstituteParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
export interface ITypeSkillCounterParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'type_skill_counter';
    duration: number;
    counterType: 'status' | 'stat_change' | 'damage';
    statusId?: number;
    statusDuration?: number;
    probability?: number;
    statIndex?: number;
    statChange?: number;
    damageValue?: number;
}
export declare class TypeSkillCounter extends BaseAtomicEffect {
    private duration;
    private counterType;
    private statusId?;
    private statusDuration;
    private probability;
    private statIndex?;
    private statChange?;
    private damageValue?;
    constructor(params: ITypeSkillCounterParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
export interface IBattleRewardParams {
    rewardType: 'coins' | 'exp' | 'items';
    amount: number;
    dailyLimit?: number;
}
export declare class BattleReward extends BaseAtomicEffect {
    private rewardType;
    private amount;
    private dailyLimit?;
    constructor(params: IBattleRewardParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=AuraAndMiscEffects.d.ts.map