import { IAtomicEffect, AtomicEffectType } from './IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
export declare abstract class BaseAtomicEffect implements IAtomicEffect {
    readonly type: AtomicEffectType;
    readonly name: string;
    readonly defaultTimings: EffectTiming[];
    constructor(type: AtomicEffectType, name: string, defaultTimings: EffectTiming[]);
    abstract execute(context: IEffectContext): IEffectResult[];
    abstract validate(params: any): boolean;
    canTriggerAt(timing: EffectTiming): boolean;
    protected createResult(success: boolean, target: 'attacker' | 'defender' | 'both', type: string, message: string, value?: number, data?: any): IEffectResult;
    protected checkProbability(chance: number): boolean;
    protected log(message: string, level?: 'debug' | 'info' | 'warn' | 'error'): void;
    protected getAttacker(context: IEffectContext): import("../../../../../../shared/models/BattleModel").IBattlePet;
    protected getDefender(context: IEffectContext): import("../../../../../../shared/models/BattleModel").IBattlePet;
    protected getTarget(context: IEffectContext, target: 'self' | 'opponent'): import("../../../../../../shared/models/BattleModel").IBattlePet;
}
//# sourceMappingURL=BaseAtomicEffect.d.ts.map