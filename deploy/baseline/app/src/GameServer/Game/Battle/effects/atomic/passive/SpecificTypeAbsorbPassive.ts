import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 特定系吸收 (2068)
 * 受到特定系的攻击会恢复自身相应体力
 * effectArgs: [elementType]
 */
export class SpecificTypeAbsorbPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SpecificTypeAbsorbPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const elementType = context.effectArgs?.[0] || 0;

    if (elementType > 0 && context.skillType === elementType && context.damage > 0) {
      const healAmount = context.damage;
      context.damage = 0;

      const oldHp = defender.hp;
      defender.hp = Math.min(defender.maxHp, defender.hp + healAmount);
      const actualHeal = defender.hp - oldHp;

      this.log(`特定系吸收: ${defender.name} 吸收属性${elementType}攻击，恢复 ${actualHeal} HP`, 'info');
      results.push(this.createResult(true, 'defender', 'specific_type_absorb',
        `${defender.name} 吸收了攻击，恢复 ${actualHeal} HP`, actualHeal,
        { elementType, absorbedDamage: healAmount }));
    }
    return results;
  }
}
