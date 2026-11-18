import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 技能破防 (2020)
 * 在被ID为xxx的技能命中前，任何技能都不能伤害自身
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export class SkillUnlockShieldPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SkillUnlockShieldPassive', [EffectTiming.BEFORE_DAMAGE_CALC, EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const unlockSkills = (context.effectArgs || []).filter(id => id > 0);

    if (!defender.effectCounters) defender.effectCounters = {};

    // 检查是否已解锁
    if (defender.effectCounters.shieldUnlocked) return results;

    // 检查当前技能是否是解锁技能
    if (unlockSkills.includes(context.skillId)) {
      if (context.timing === EffectTiming.AFTER_DAMAGE_APPLY) {
        defender.effectCounters.shieldUnlocked = true;
        this.log(`技能破防: ${defender.name} 护盾被技能 ${context.skillId} 解除`, 'info');
        results.push(this.createResult(true, 'defender', 'shield_unlock',
          `${defender.name} 的护盾被解除`, 0, { skillId: context.skillId }));
      }
    } else if (context.timing === EffectTiming.BEFORE_DAMAGE_CALC) {
      // 未解锁时免疫伤害
      context.damage = 0;
      context.isBlocked = true;
      this.log(`技能破防: ${defender.name} 护盾阻挡了伤害`, 'info');
      results.push(this.createResult(true, 'defender', 'shield_block',
        `${defender.name} 的护盾阻挡了攻击`, 0,
        { requiredSkills: unlockSkills }));
    }
    return results;
  }
}

/**
 * 属性顺序破防 (2027)
 * 按一定的属性顺序出招的技能才能造成伤害
 * effectArgs: [type1, type2, ..., type8]
 */
export class TypeSequenceShieldPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'TypeSequenceShieldPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const typeSequence = (context.effectArgs || []).filter(t => t > 0);

    if (typeSequence.length === 0) return results;

    if (!defender.effectCounters) defender.effectCounters = {};
    const currentIndex = defender.effectCounters.typeSequenceIndex || 0;
    const expectedType = typeSequence[currentIndex % typeSequence.length];

    if (context.skillType === expectedType) {
      // 正确属性，推进序列
      defender.effectCounters.typeSequenceIndex = currentIndex + 1;
      this.log(`属性顺序破防: 正确属性 ${context.skillType}, 进度 ${currentIndex + 1}/${typeSequence.length}`, 'info');
      results.push(this.createResult(true, 'defender', 'sequence_progress',
        `属性顺序正确`, currentIndex + 1,
        { expectedType, progress: currentIndex + 1, total: typeSequence.length }));
    } else {
      // 错误属性，重置并免疫伤害
      defender.effectCounters.typeSequenceIndex = 0;
      context.damage = 0;
      context.isBlocked = true;
      this.log(`属性顺序破防: 错误属性 ${context.skillType}, 需要 ${expectedType}`, 'info');
      results.push(this.createResult(true, 'defender', 'shield_block',
        `属性顺序错误，攻击被阻挡`, 0,
        { expectedType, actualType: context.skillType }));
    }
    return results;
  }
}

/**
 * 轮换属性护盾 (2036)
 * 按5回合轮换属性顺序出招的技能才能造成伤害
 * effectArgs: [type1, type2, ..., type8]
 */
export class RotatingTypeShieldPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'RotatingTypeShieldPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const typeList = (context.effectArgs || []).filter(t => t > 0);

    if (typeList.length === 0) return results;

    // 每5回合轮换一次当前有效属性
    const cycleIndex = Math.floor((context.turn - 1) / 5) % typeList.length;
    const currentAllowedType = typeList[cycleIndex];

    if (context.skillType !== currentAllowedType) {
      context.damage = 0;
      context.isBlocked = true;
      this.log(`轮换属性护盾: 当前需要属性 ${currentAllowedType}, 实际 ${context.skillType}`, 'info');
      results.push(this.createResult(true, 'defender', 'rotating_shield_block',
        `当前只接受属性 ${currentAllowedType} 的攻击`, 0,
        { currentAllowedType, actualType: context.skillType, cycleIndex }));
    }
    return results;
  }
}
