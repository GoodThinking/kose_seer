import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 受击后减伤 (2049)
 * 受到物理攻击或特殊攻击后，下n回合受物理攻击或特殊攻击伤害减免m%
 * effectArgs: [duration, reducePercent]
 */
export class PostHitDamageReductionPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'PostHitDamageReductionPassive', [EffectTiming.AFTER_DAMAGE_APPLY, EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const duration = context.effectArgs?.[0] || 0;
    const reducePercent = context.effectArgs?.[1] || 0;

    if (!defender.effectCounters) defender.effectCounters = {};

    if (context.timing === EffectTiming.AFTER_DAMAGE_APPLY) {
      // 受到攻击后激活减伤
      if (context.damage > 0 && (context.skillCategory === 1 || context.skillCategory === 2)) {
        defender.effectCounters.postHitReductionTurns = duration;
        defender.effectCounters.postHitReductionPercent = reducePercent;
        this.log(`受击后减伤: 激活 ${duration} 回合 ${reducePercent}% 减伤`, 'info');
        results.push(this.createResult(true, 'defender', 'post_hit_reduction_activate',
          `激活 ${duration} 回合减伤`, 0, { duration, reducePercent }));
      }
    } else if (context.timing === EffectTiming.AFTER_DAMAGE_CALC) {
      // 减伤生效
      const remainTurns = defender.effectCounters.postHitReductionTurns || 0;
      const percent = defender.effectCounters.postHitReductionPercent || 0;

      if (remainTurns > 0 && percent > 0 && context.damage > 0 &&
          (context.skillCategory === 1 || context.skillCategory === 2)) {
        const oldDamage = context.damage;
        context.damage = Math.max(1, Math.floor(context.damage * (1 - percent / 100)));
        defender.effectCounters.postHitReductionTurns = remainTurns - 1;
        results.push(this.createResult(true, 'defender', 'post_hit_reduction',
          `减伤 ${percent}%`, oldDamage - context.damage, { remainTurns: remainTurns - 1 }));
      }
    }
    return results;
  }
}
