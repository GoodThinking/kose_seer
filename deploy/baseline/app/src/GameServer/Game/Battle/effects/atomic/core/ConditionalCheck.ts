import { BaseAtomicEffect } from './BaseAtomicEffect';
import { AtomicEffectType, ConditionType, IConditionalParams, IAtomicEffect } from './IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { atomicEffectFactory } from './AtomicEffectFactory';

/**
 * 条件判断原子效果
 * 根据条件判断执行不同的效果
 */
export class ConditionalCheck extends BaseAtomicEffect {
  private params: IConditionalParams;
  private thenEffects: IAtomicEffect[] = [];
  private elseEffects: IAtomicEffect[] = [];

  constructor(params: IConditionalParams) {
    super(AtomicEffectType.CONDITIONAL, 'Conditional Check', []);
    this.params = params;

    // 创建then分支的子效果
    if (params.then && params.then.length > 0) {
      this.thenEffects = atomicEffectFactory.createBatch(params.then);
    }

    // 创建else分支的子效果
    if (params.else && params.else.length > 0) {
      this.elseEffects = atomicEffectFactory.createBatch(params.else);
    }
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const conditionMet = this.checkCondition(context);

    // 添加条件判断结果
    results.push(this.createResult(
      conditionMet,
      'both',
      'conditional',
      `条件${this.params.condition}判定: ${conditionMet ? '成功' : '失败'}`,
      conditionMet ? 1 : 0
    ));

    // 根据条件执行对应分支的效果
    const effectsToExecute = conditionMet ? this.thenEffects : this.elseEffects;
    for (const effect of effectsToExecute) {
      const subResults = effect.execute(context);
      results.push(...subResults);
    }

    return results;
  }

  private checkCondition(context: IEffectContext): boolean {
    switch (this.params.condition) {
      case ConditionType.ALWAYS:
        return true;
      case ConditionType.NEVER:
        return false;
      case ConditionType.PROBABILITY:
        return this.checkProbability(Number((this.params as any).probability ?? (this.params.value || 50)));
      case ConditionType.FIRST_STRIKE:
        return (context.attacker as any).effectStates?._first ?? context.attacker.speed > context.defender.speed;
      case ConditionType.SECOND_STRIKE:
        return !((context.attacker as any).effectStates?._first ?? context.attacker.speed > context.defender.speed);
      case ConditionType.HP_LOWER_THAN_TARGET:
        return context.attacker.hp < context.defender.hp;
      case ConditionType.HP_PERCENT_BELOW: {
        const params = this.params as IConditionalParams & { hpDivisor?: number; target?: 'self' | 'opponent' };
        const pet = params.target === 'opponent' ? context.defender : context.attacker;
        const threshold = params.hpDivisor ? 100 / Number(params.hpDivisor) : Number(params.value);
        return pet.maxHp > 0 && pet.hp * 100 < pet.maxHp * threshold;
      }
      case ConditionType.SELF_HAS_STATUS:
      case ConditionType.TARGET_HAS_STATUS: {
        const pet = this.params.condition === ConditionType.SELF_HAS_STATUS ? context.attacker : context.defender;
        return ([] as unknown[]).concat(this.params.value).some(status => (pet.statusDurations?.[Number(status)] ?? 0) > 0);
      }
      case ConditionType.SAME_TYPE: {
        const params = this.params as IConditionalParams & { compare?: 'opponent' };
        return params.compare === 'opponent' ? context.attacker.type === context.defender.type : context.skillType === context.attacker.type;
      }
      case ConditionType.SELF_HAS_STAT_DEBUFF:
      case ConditionType.TARGET_HAS_STAT_DEBUFF: {
        const pet = this.params.condition === ConditionType.SELF_HAS_STAT_DEBUFF ? context.attacker : context.defender;
        return (pet.battleLevels ?? []).some(level => level < 0);
      }
      default:
        this.log(`未实现的条件类型: ${this.params.condition}`, 'warn');
        return false;
    }
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.CONDITIONAL &&
           Object.values(ConditionType).includes(params.condition);
  }
}
