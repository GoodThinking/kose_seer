import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 闪避提升 (2007)
 * 任何技能对自身的命中率下降n%
 * effectArgs: [reducePercent]
 */
export class AccuracyReductionPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'AccuracyReductionPassive', [EffectTiming.BEFORE_HIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const reducePercent = context.effectArgs?.[0] || 0;

    if (reducePercent > 0) {
      context.hitRateModifier -= reducePercent;
      this.log(`闪避提升: 命中率降低 ${reducePercent}%`, 'info');
      results.push(this.createResult(true, 'defender', 'accuracy_reduction',
        `命中率降低 ${reducePercent}%`, reducePercent));
    }
    return results;
  }
}

/**
 * 技能闪避 (2024)
 * 对方用这些技能时，对自身的命中率为0
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export class SkillDodgePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SkillDodgePassive', [EffectTiming.BEFORE_HIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const dodgeSkills = (context.effectArgs || []).filter(id => id > 0);

    if (dodgeSkills.includes(context.skillId)) {
      context.hitRateModifier = -100;
      context.isMiss = true;
      this.log(`技能闪避: 技能 ${context.skillId} 被完全闪避`, 'info');
      results.push(this.createResult(true, 'defender', 'skill_dodge',
        `完全闪避了技能 ${context.skillId}`, 0, { skillId: context.skillId }));
    }
    return results;
  }
}

/**
 * 命中率提升 (2029)
 * 自身的所有技能命中率增加n%
 * effectArgs: [bonusPercent]
 */
export class AccuracyBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'AccuracyBonusPassive', [EffectTiming.BEFORE_HIT_CHECK]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const bonusPercent = context.effectArgs?.[0] || 0;

    if (bonusPercent > 0) {
      context.hitRateModifier += bonusPercent;
      this.log(`命中率提升: 命中率增加 ${bonusPercent}%`, 'info');
      results.push(this.createResult(true, 'attacker', 'accuracy_bonus',
        `命中率增加 ${bonusPercent}%`, bonusPercent));
    }
    return results;
  }
}
