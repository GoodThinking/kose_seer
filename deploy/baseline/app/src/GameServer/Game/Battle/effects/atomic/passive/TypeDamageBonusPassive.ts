import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 属性伤害加成 (2028)
 * XX系技能伤害增加n%
 * effectArgs: [elementType, bonusPercent]
 */
export class TypeDamageBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'TypeDamageBonusPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const elementType = context.effectArgs?.[0] || 0;
    const bonusPercent = context.effectArgs?.[1] || 0;

    if (context.skillType === elementType && bonusPercent > 0) {
      context.damageMultiplier *= (1 + bonusPercent / 100);
      this.log(`属性伤害加成: 属性${elementType} 伤害+${bonusPercent}%`, 'info');
      results.push(this.createResult(true, 'attacker', 'type_damage_bonus',
        `${elementType}系技能伤害增加 ${bonusPercent}%`, bonusPercent,
        { elementType, bonusPercent }));
    }
    return results;
  }
}
