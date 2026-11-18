import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 高伤反杀 (2037)
 * 自身一次受到大于n的伤害时直接将对方体力降至0
 * effectArgs: [thresholdHigh, thresholdLow]
 */
export class HighDamageCounterKillPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'HighDamageCounterKillPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const thresholdHigh = context.effectArgs?.[0] || 0;
    const thresholdLow = context.effectArgs?.[1] || 0;
    const threshold = (thresholdHigh << 16) | thresholdLow;

    if (context.damage > threshold && attacker.hp > 0) {
      attacker.hp = 0;
      this.log(`高伤反杀: 伤害 ${context.damage} > ${threshold}, 秒杀 ${attacker.name}`, 'info');
      results.push(this.createResult(true, 'attacker', 'high_damage_counter_kill',
        `${attacker.name} 被反杀`, attacker.maxHp,
        { threshold, damage: context.damage }));
    }
    return results;
  }
}
