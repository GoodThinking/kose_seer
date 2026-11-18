import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 性别伤害加成 (2069)
 * 目标为n性别时，所有攻击伤害增加m%
 * effectArgs: [gender, bonusPercent]
 */
export class GenderDamageBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'GenderDamageBonusPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const gender = context.effectArgs?.[0] || 0;
    const bonusPercent = context.effectArgs?.[1] || 0;

    // 检查目标性别（通过effectCounters存储）
    const defenderGender = defender.effectCounters?.gender || 0;
    if (bonusPercent > 0 && defenderGender === gender) {
      context.damageMultiplier *= (1 + bonusPercent / 100);
      this.log(`性别伤害加成: 目标性别${gender}, 伤害+${bonusPercent}%`, 'info');
      results.push(this.createResult(true, 'attacker', 'gender_damage_bonus',
        `对指定性别目标伤害增加 ${bonusPercent}%`, bonusPercent,
        { gender, bonusPercent }));
    }
    return results;
  }
}
