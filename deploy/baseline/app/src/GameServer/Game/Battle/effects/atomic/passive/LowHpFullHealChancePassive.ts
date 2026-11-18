import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 低血概率回满 (2033)
 * 精灵体力降低到1/n时有m%几率体力回满
 * effectArgs: [hpFraction, chance]
 */
export class LowHpFullHealChancePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'LowHpFullHealChancePassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const hpFraction = context.effectArgs?.[0] || 4;
    const chance = context.effectArgs?.[1] || 0;

    if (defender.hp > 0 && defender.maxHp > 0 && hpFraction > 0) {
      const threshold = Math.floor(defender.maxHp / hpFraction);
      if (defender.hp <= threshold && this.checkProbability(chance)) {
        const oldHp = defender.hp;
        defender.hp = defender.maxHp;
        this.log(`低血概率回满: ${defender.name} HP ${oldHp} -> ${defender.maxHp}`, 'info');
        results.push(this.createResult(true, 'defender', 'low_hp_full_heal',
          `${defender.name} 体力回满！`, defender.maxHp - oldHp,
          { hpFraction, chance, threshold }));
      }
    }
    return results;
  }
}
