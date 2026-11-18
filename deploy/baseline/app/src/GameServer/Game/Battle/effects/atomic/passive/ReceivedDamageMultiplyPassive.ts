import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 受击伤害倍增 (2022)
 * 被打时受到直接攻击伤害提高至n倍
 * effectArgs: [multiplier]
 */
export class ReceivedDamageMultiplyPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'ReceivedDamageMultiplyPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const multiplier = context.effectArgs?.[0] || 2;

    if (context.damage > 0 && multiplier > 1) {
      const oldDamage = context.damage;
      context.damage = Math.floor(context.damage * multiplier);
      this.log(`受击伤害倍增: ${oldDamage} -> ${context.damage} (x${multiplier})`, 'info');
      results.push(this.createResult(true, 'defender', 'received_damage_multiply',
        `受到伤害提高至 ${multiplier} 倍`, context.damage - oldDamage,
        { multiplier, oldDamage }));
    }
    return results;
  }
}
