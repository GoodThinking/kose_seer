import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 受击致异常 (2006)
 * 受到普通属性伤害时以n%的概率使对方进入异常状态
 * effectArgs: [statusType, chance]
 */
export class OnHitStatusInflictPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'OnHitStatusInflictPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const attacker = this.getAttacker(context);
    const statusType = context.effectArgs?.[0] || 0;
    const chance = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && context.skillType === 8 && this.checkProbability(chance)) {
      if (!attacker.statusDurations) attacker.statusDurations = new Array(20).fill(0);
      attacker.statusDurations[statusType] = 3;
      attacker.status = statusType;
      attacker.statusTurns = 3;

      this.log(`${defender.name} 受击致异常: 使 ${attacker.name} 进入状态 ${statusType}`, 'info');
      results.push(this.createResult(true, 'attacker', 'status_inflict',
        `${attacker.name} 被施加了异常状态 ${statusType}`, statusType,
        { statusType, chance }));
    }
    return results;
  }
}

/**
 * 物攻致异常 (2066)
 * 自身的物攻有n%几率使对方处于异常状态
 * effectArgs: [chance, statusType]
 */
export class PhysHitStatusInflictPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'PhysHitStatusInflictPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const chance = context.effectArgs?.[0] || 0;
    const statusType = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && context.skillCategory === 1 && this.checkProbability(chance)) {
      if (!defender.statusDurations) defender.statusDurations = new Array(20).fill(0);
      defender.statusDurations[statusType] = 3;
      defender.status = statusType;
      defender.statusTurns = 3;

      this.log(`${attacker.name} 物攻致异常: 使 ${defender.name} 进入状态 ${statusType}`, 'info');
      results.push(this.createResult(true, 'defender', 'status_inflict',
        `${defender.name} 被施加了异常状态 ${statusType}`, statusType,
        { statusType, chance }));
    }
    return results;
  }
}

/**
 * 特攻致异常 (2067)
 * 自身的特攻有n%几率使对方处于异常状态
 * effectArgs: [chance, statusType]
 */
export class SpHitStatusInflictPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SpHitStatusInflictPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const chance = context.effectArgs?.[0] || 0;
    const statusType = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && context.skillCategory === 2 && this.checkProbability(chance)) {
      if (!defender.statusDurations) defender.statusDurations = new Array(20).fill(0);
      defender.statusDurations[statusType] = 3;
      defender.status = statusType;
      defender.statusTurns = 3;

      this.log(`${attacker.name} 特攻致异常: 使 ${defender.name} 进入状态 ${statusType}`, 'info');
      results.push(this.createResult(true, 'defender', 'status_inflict',
        `${defender.name} 被施加了异常状态 ${statusType}`, statusType,
        { statusType, chance }));
    }
    return results;
  }
}

/**
 * 受特攻致异常 (2078)
 * 受到特殊攻击伤害时以n%的概率使对方进入异常状态
 * effectArgs: [statusType, chance]
 */
export class OnSpHitStatusInflictPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'OnSpHitStatusInflictPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const attacker = this.getAttacker(context);
    const statusType = context.effectArgs?.[0] || 0;
    const chance = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && context.skillCategory === 2 && this.checkProbability(chance)) {
      if (!attacker.statusDurations) attacker.statusDurations = new Array(20).fill(0);
      attacker.statusDurations[statusType] = 3;
      attacker.status = statusType;
      attacker.statusTurns = 3;

      this.log(`${defender.name} 受特攻致异常: 使 ${attacker.name} 进入状态 ${statusType}`, 'info');
      results.push(this.createResult(true, 'attacker', 'status_inflict',
        `${attacker.name} 被施加了异常状态 ${statusType}`, statusType,
        { statusType, chance }));
    }
    return results;
  }
}
