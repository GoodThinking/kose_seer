import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 天敌害怕 (2014)
 * 若遇到天敌，则战斗开始时连续害怕n回合
 * effectArgs: [fearTurns]
 * 天敌判定：对方属性克制自身属性
 */
export class CounterFearPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'CounterFearPassive', [EffectTiming.BATTLE_START]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const fearTurns = context.effectArgs?.[0] || 0;

    if (fearTurns > 0) {
      // 设置害怕状态
      if (!attacker.statusDurations) attacker.statusDurations = new Array(20).fill(0);
      attacker.statusDurations[6] = fearTurns; // 6 = FEAR
      attacker.status = 6;
      attacker.statusTurns = fearTurns;

      if (!attacker.effectCounters) attacker.effectCounters = {};
      attacker.effectCounters.counterFear = fearTurns;

      this.log(`天敌害怕: ${attacker.name} 害怕 ${fearTurns} 回合`, 'info');
      results.push(this.createResult(true, 'attacker', 'counter_fear',
        `${attacker.name} 遇到天敌，害怕 ${fearTurns} 回合`, fearTurns));
    }
    return results;
  }
}

/**
 * 天敌伤害减少 (2015)
 * 若遇到天敌，则整个战斗中对天敌的伤害减少n%
 * effectArgs: [reducePercent]
 */
export class CounterDamageReducePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'CounterDamageReducePassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const reducePercent = context.effectArgs?.[0] || 0;

    if (reducePercent > 0 && context.damage > 0) {
      const reduction = Math.floor(context.damage * reducePercent / 100);
      context.damage = Math.max(1, context.damage - reduction);
      context.damageMultiplier *= (1 - reducePercent / 100);

      this.log(`天敌伤害减少: 伤害减少 ${reducePercent}%`, 'info');
      results.push(this.createResult(true, 'attacker', 'counter_damage_reduce',
        `对天敌伤害减少 ${reducePercent}%`, reduction,
        { reducePercent }));
    }
    return results;
  }
}

/**
 * 天敌先制降低 (2043)
 * 遇到天敌自身所有技能先制减少n
 * effectArgs: [priorityReduce]
 */
export class CounterPriorityReducePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'CounterPriorityReducePassive', [EffectTiming.BEFORE_SPEED_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const priorityReduce = context.effectArgs?.[0] || 0;

    if (priorityReduce > 0) {
      context.priorityModifier -= priorityReduce;
      this.log(`天敌先制降低: 先制 -${priorityReduce}`, 'info');
      results.push(this.createResult(true, 'attacker', 'counter_priority_reduce',
        `先制降低 ${priorityReduce}`, priorityReduce));
    }
    return results;
  }
}
