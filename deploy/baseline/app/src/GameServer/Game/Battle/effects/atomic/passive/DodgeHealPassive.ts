import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 闪避回血 (2082)
 * 每躲避一次攻击，该回合结束后会回复n体力
 * effectArgs: [healAmount]
 */
export class DodgeHealPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'DodgeHealPassive', [EffectTiming.AFTER_HIT_CHECK, EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const healAmount = context.effectArgs?.[0] || 0;

    if (!defender.effectCounters) defender.effectCounters = {};

    if (context.timing === EffectTiming.AFTER_HIT_CHECK) {
      // 记录闪避
      if (context.isMiss) {
        defender.effectCounters.dodgeHealPending = (defender.effectCounters.dodgeHealPending || 0) + healAmount;
        results.push(this.createResult(true, 'defender', 'dodge_heal_pending',
          `闪避成功，回合结束后恢复 ${healAmount} HP`, healAmount));
      }
    } else if (context.timing === EffectTiming.TURN_END) {
      // 回合结束时恢复
      const pendingHeal = defender.effectCounters.dodgeHealPending || 0;
      if (pendingHeal > 0 && defender.hp > 0) {
        const oldHp = defender.hp;
        defender.hp = Math.min(defender.maxHp, defender.hp + pendingHeal);
        const actualHeal = defender.hp - oldHp;
        defender.effectCounters.dodgeHealPending = 0;
        if (actualHeal > 0) {
          this.log(`闪避回血: ${defender.name} 恢复 ${actualHeal} HP`, 'info');
          results.push(this.createResult(true, 'defender', 'dodge_heal',
            `${defender.name} 闪避回血 ${actualHeal} HP`, actualHeal));
        }
      }
    }
    return results;
  }
}
