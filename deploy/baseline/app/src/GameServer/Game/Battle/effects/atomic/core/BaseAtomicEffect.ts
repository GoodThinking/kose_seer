import { IAtomicEffect, AtomicEffectType } from './IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { Logger } from '../../../../../../shared/utils/Logger';

export abstract class BaseAtomicEffect implements IAtomicEffect {
  public readonly type: AtomicEffectType;
  public readonly name: string;
  public readonly defaultTimings: EffectTiming[];

  constructor(type: AtomicEffectType, name: string, defaultTimings: EffectTiming[]) {
    this.type = type;
    this.name = name;
    this.defaultTimings = defaultTimings;
  }

  public abstract execute(context: IEffectContext): IEffectResult[];
  public abstract validate(params: any): boolean;

  public canTriggerAt(timing: EffectTiming): boolean {
    if (this.defaultTimings.length === 0) return true;
    return this.defaultTimings.includes(timing);
  }

  protected createResult(
    success: boolean,
    target: 'attacker' | 'defender' | 'both',
    type: string,
    message: string,
    value?: number,
    data?: any
  ): IEffectResult {
    return { effectId: 0, effectName: this.name, success, target, type, value, message, data };
  }

  protected checkProbability(chance: number): boolean {
    return Math.random() * 100 < chance;
  }

  protected log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'debug'): void {
    const fullMessage = `[${this.name}] ${message}`;
    switch (level) {
      case 'debug': Logger.Debug(fullMessage); break;
      case 'info': Logger.Info(fullMessage); break;
      case 'warn': Logger.Warn(fullMessage); break;
      case 'error': Logger.Error(fullMessage, new Error(message)); break;
    }
  }

  protected getAttacker(context: IEffectContext) { return context.attacker; }
  protected getDefender(context: IEffectContext) { return context.defender; }
  protected getTarget(context: IEffectContext, target: 'self' | 'opponent') {
    return target === 'self' ? context.attacker : context.defender;
  }
}
