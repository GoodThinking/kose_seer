import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
export interface IKoDamageNextParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'ko_damage_next';
    mode: 'percent' | 'fixed' | 'overflow';
    value?: number;
}
export declare class KoDamageNext extends BaseAtomicEffect {
    private mode;
    private value;
    constructor(params: IKoDamageNextParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
export interface IKoTransferBuffParams {
    onlyPositive?: boolean;
}
export declare class KoTransferBuff extends BaseAtomicEffect {
    private onlyPositive;
    constructor(params: IKoTransferBuffParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
export interface IMissPenaltyParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'miss_penalty';
    penaltyType: 'hp_damage' | 'stat_down' | 'status';
    hpDamage?: number;
    hpDamageMode?: 'percent' | 'fixed';
    statIndex?: number;
    statChange?: number;
    statusId?: number;
}
export declare class MissPenalty extends BaseAtomicEffect {
    private penaltyType;
    private hpDamage;
    private hpDamageMode;
    private statIndex;
    private statChange;
    private statusId;
    constructor(params: IMissPenaltyParams);
    execute(context: IEffectContext): IEffectResult[];
    private applyHpDamagePenalty;
    private applyStatDownPenalty;
    private applyStatusPenalty;
    private getMissPenaltyState;
    validate(params: any): boolean;
}
export interface IOnOpponentMissParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'on_opponent_miss';
    duration: number;
    effect: 'focus_energy' | 'stat_boost' | 'heal';
    effectDuration?: number;
    statIndex?: number;
    statChange?: number;
    healAmount?: number;
}
export declare class OnOpponentMiss extends BaseAtomicEffect {
    private duration;
    private effect;
    private effectDuration;
    private statIndex?;
    private statChange?;
    private healAmount?;
    constructor(params: IOnOpponentMissParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
export interface IOnEvadeBoostParams {
    duration: number;
    chance: number;
    statIndex: number;
    boostLevel: number;
}
export declare class OnEvadeBoost extends BaseAtomicEffect {
    private duration;
    private chance;
    private statIndex;
    private boostLevel;
    constructor(params: IOnEvadeBoostParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
export interface IDelayedKillParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'delayed_kill';
    delay: number;
    canBeHealed?: boolean;
}
export declare class DelayedKill extends BaseAtomicEffect {
    private delay;
    private canBeHealed;
    constructor(params: IDelayedKillParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    private getKillState;
}
//# sourceMappingURL=TriggerEffects.d.ts.map