import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 免疫特效 (2050)
 * 免疫某类特效
 * effectArgs: [effectId1, effectId2, ..., effectId8]
 */
export class EffectImmunityPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'EffectImmunityPassive', [EffectTiming.BATTLE_START]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const immuneEffects = (context.effectArgs || []).filter(id => id > 0);

    if (immuneEffects.length > 0) {
      if (!attacker.effectCounters) attacker.effectCounters = {};
      attacker.effectCounters.immuneEffects = immuneEffects;

      this.log(`免疫特效: ${attacker.name} 免疫效果 [${immuneEffects.join(',')}]`, 'info');
      results.push(this.createResult(true, 'attacker', 'effect_immunity',
        `${attacker.name} 免疫指定特效`, 0, { immuneEffects }));
    }
    return results;
  }
}

/**
 * 免疫指定技能特效 (2185)
 * 免疫指定技能的特效
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export class SkillEffectImmunityPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SkillEffectImmunityPassive', [EffectTiming.BATTLE_START]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const immuneSkills = (context.effectArgs || []).filter(id => id > 0);

    if (immuneSkills.length > 0) {
      if (!attacker.effectCounters) attacker.effectCounters = {};
      attacker.effectCounters.immuneSkillEffects = immuneSkills;

      this.log(`免疫指定技能特效: ${attacker.name} 免疫技能 [${immuneSkills.join(',')}] 的特效`, 'info');
      results.push(this.createResult(true, 'attacker', 'skill_effect_immunity',
        `${attacker.name} 免疫指定技能特效`, 0, { immuneSkills }));
    }
    return results;
  }
}
