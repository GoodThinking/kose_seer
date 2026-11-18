import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
export interface IChargeParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'charge';
    chargeTurns: number;
    chargePowerMultiplier?: number;
    releasePowerMultiplier?: number;
    canActDuringCharge?: boolean;
    chargeMessage?: string;
    releaseMessage?: string;
}
export declare class Charge extends BaseAtomicEffect {
    private chargeTurns;
    private chargePowerMultiplier;
    private releasePowerMultiplier;
    private canActDuringCharge;
    private chargeMessage;
    private releaseMessage;
    constructor(params: IChargeParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    private getChargeState;
}
export interface IConsecutiveUseParams {
    incrementPerUse: number;
    maxIncrement: number;
    resetOnSwitch?: boolean;
}
export declare class ConsecutiveUse extends BaseAtomicEffect {
    private incrementPerUse;
    private maxIncrement;
    private resetOnSwitch;
    private static consecutiveUseCount;
    constructor(params: IConsecutiveUseParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    static resetCount(petId: number, skillId?: number): void;
    static clearAll(): void;
}
export interface IEncoreParams {
    duration: number;
    canBeInterrupted?: boolean;
}
export declare class Encore extends BaseAtomicEffect {
    private duration;
    private canBeInterrupted;
    constructor(params: IEncoreParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
export interface IPPDrainParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'pp_drain';
    target: 'self' | 'opponent';
    mode: 'fixed' | 'percent' | 'all';
    value?: number;
    targetSkillId?: number;
    probability?: number;
}
export declare class PPDrain extends BaseAtomicEffect {
    private target;
    private mode;
    private value;
    private targetSkillId?;
    private probability;
    constructor(params: IPPDrainParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    private getTargetSkills;
}
export interface IPPRestoreParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'pp_restore';
    mode: 'all' | 'specific' | 'random';
    amount: number;
    skillIndex?: number;
    target?: 'self' | 'opponent';
}
export declare class PPRestore extends BaseAtomicEffect {
    private mode;
    private amount;
    private skillIndex;
    private target;
    constructor(params: IPPRestoreParams);
    execute(context: IEffectContext): IEffectResult[];
    private restoreAllSkills;
    private restoreSpecificSkill;
    private restoreRandomSkill;
    private restoreSkillPP;
    validate(params: any): boolean;
}
//# sourceMappingURL=SkillMechanics.d.ts.map