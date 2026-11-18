import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 固定会心率 (2008)
 * 自身的会心一击率为n/16
 * effectArgs: [critNumerator]
 */
export class FixedCritRatePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'FixedCritRatePassive', [EffectTiming.BEFORE_CRIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const critNumerator = context.effectArgs?.[0] || 0;

    if (critNumerator > 0) {
      context.critRate = critNumerator / 16;
      this.log(`固定会心率: ${critNumerator}/16`, 'info');
      results.push(this.createResult(true, 'attacker', 'fixed_crit_rate',
        `会心率固定为 ${critNumerator}/16`, critNumerator));
    }
    return results;
  }
}

/**
 * 会心率提升 (2030)
 * 所有技能的致命一击率增加n/16
 * effectArgs: [critBonus]
 */
export class CritRateBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'CritRateBonusPassive', [EffectTiming.BEFORE_CRIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const critBonus = context.effectArgs?.[0] || 0;

    if (critBonus > 0) {
      context.critRateBonus = (context.critRateBonus || 0) + critBonus / 16;
      this.log(`会心率提升: +${critBonus}/16`, 'info');
      results.push(this.createResult(true, 'attacker', 'crit_rate_bonus',
        `致命一击率增加 ${critBonus}/16`, critBonus));
    }
    return results;
  }
}

/**
 * 固定致命率 (2045)
 * 自身所有技能致命一击率固定是1/n
 * effectArgs: [critDivisor]
 */
export class FixedCritDivisorPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'FixedCritDivisorPassive', [EffectTiming.BEFORE_CRIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const critDivisor = context.effectArgs?.[0] || 16;

    if (critDivisor > 0) {
      context.critRate = 1 / critDivisor;
      this.log(`固定致命率: 1/${critDivisor}`, 'info');
      results.push(this.createResult(true, 'attacker', 'fixed_crit_divisor',
        `致命一击率固定为 1/${critDivisor}`, critDivisor));
    }
    return results;
  }
}

/**
 * 异常状态暴击 (2057)
 * 如果对方存在某异常状态，则自己攻击的致命一击率提高n/16
 * effectArgs: [statusType, critBonus]
 */
export class StatusCritBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'StatusCritBonusPassive', [EffectTiming.BEFORE_CRIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const statusType = context.effectArgs?.[0] || 0;
    const critBonus = context.effectArgs?.[1] || 0;

    const hasStatus = defender.statusDurations && defender.statusDurations[statusType] > 0;
    if (hasStatus && critBonus > 0) {
      context.critRateBonus = (context.critRateBonus || 0) + critBonus / 16;
      this.log(`异常暴击: 对方有状态 ${statusType}, 致命率+${critBonus}/16`, 'info');
      results.push(this.createResult(true, 'attacker', 'status_crit_bonus',
        `对方异常状态下致命率增加 ${critBonus}/16`, critBonus,
        { statusType }));
    }
    return results;
  }
}

/**
 * 致命率降低 (2064)
 * 受到致命一击的概率降低n/16
 * effectArgs: [critReduce]
 */
export class CritRateReducePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'CritRateReducePassive', [EffectTiming.BEFORE_CRIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const critReduce = context.effectArgs?.[0] || 0;

    if (critReduce > 0) {
      context.critRateBonus = (context.critRateBonus || 0) - critReduce / 16;
      this.log(`致命率降低: -${critReduce}/16`, 'info');
      results.push(this.createResult(true, 'defender', 'crit_rate_reduce',
        `受到致命一击概率降低 ${critReduce}/16`, critReduce));
    }
    return results;
  }
}
