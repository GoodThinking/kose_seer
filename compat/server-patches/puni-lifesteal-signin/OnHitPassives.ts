import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 低伤回血 (2072)
 * 受到的伤害低于n时，则在受到伤害后恢复自身n点体力值
 * effectArgs: [threshold]
 */
export class LowDamageHealPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'LowDamageHealPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const threshold = context.effectArgs?.[0] || 0;

    if (context.damage > 0 && context.damage < threshold && defender.hp > 0) {
      const oldHp = defender.hp;
      defender.hp = Math.min(defender.maxHp, defender.hp + threshold);
      const actualHeal = defender.hp - oldHp;
      if (actualHeal > 0) {
        this.log(`低伤回血: 伤害 ${context.damage} < ${threshold}, 恢复 ${actualHeal} HP`, 'info');
        results.push(this.createResult(true, 'defender', 'low_damage_heal',
          `${defender.name} 恢复 ${actualHeal} HP`, actualHeal,
          { threshold, damage: context.damage }));
      }
    }
    return results;
  }
}

/**
 * 伤害吸血 (2073)
 * 给对方造成的伤害会恢复自身n%体力
 * effectArgs: [healPercent]
 */
export class DamageLifestealPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'DamageLifestealPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const healPercent = context.effectArgs?.[0] || 0;

    if (context.damage > 0 && healPercent > 0 && attacker.hp > 0) {
      const healAmount = Math.floor(context.damage * healPercent / 100);
      const oldHp = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
      const actualHeal = attacker.hp - oldHp;
      if (actualHeal > 0) {
        this.log(`伤害吸血: 恢复 ${actualHeal} HP`, 'info');
        results.push(this.createResult(true, 'attacker', 'absorb',
          `${attacker.name} 吸血恢复 ${actualHeal} HP`, actualHeal,
          { healPercent, damage: context.damage }));
      }
    }
    return results;
  }
}

/**
 * 命中叠衰弱 (2074)
 * 每次物理或特殊攻击命中对手后，有百分之n的概率给对手叠加一层衰弱
 * effectArgs: [chance]
 */
export class HitStackWeaknessPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'HitStackWeaknessPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const chance = context.effectArgs?.[0] || 0;

    if (context.damage > 0 && (context.skillCategory === 1 || context.skillCategory === 2) &&
        this.checkProbability(chance)) {
      if (!defender.statusDurations) defender.statusDurations = new Array(20).fill(0);
      defender.statusDurations[11] = (defender.statusDurations[11] || 0) + 3; // 11 = WEAKNESS
      defender.status = 11;
      defender.statusTurns = defender.statusDurations[11];

      if (!defender.effectCounters) defender.effectCounters = {};
      defender.effectCounters.weaknessStacks = (defender.effectCounters.weaknessStacks || 0) + 1;

      this.log(`命中叠衰弱: ${defender.name} 衰弱层数 ${defender.effectCounters.weaknessStacks}`, 'info');
      results.push(this.createResult(true, 'defender', 'hit_stack_weakness',
        `${defender.name} 被叠加了一层衰弱`, defender.effectCounters.weaknessStacks,
        { chance }));
    }
    return results;
  }
}

/**
 * 高伤下招翻倍 (2079)
 * 受到超过n的伤害时，下一招威力翻倍
 * effectArgs: [threshold]
 */
export class HighDamageNextDoublePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'HighDamageNextDoublePassive', [EffectTiming.AFTER_DAMAGE_APPLY, EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const threshold = context.effectArgs?.[0] || 0;

    if (context.timing === EffectTiming.AFTER_DAMAGE_APPLY) {
      const defender = this.getDefender(context);
      if (context.damage > threshold) {
        if (!defender.effectCounters) defender.effectCounters = {};
        defender.effectCounters.nextAttackDouble = true;
        this.log(`高伤下招翻倍: 伤害 ${context.damage} > ${threshold}`, 'info');
        results.push(this.createResult(true, 'defender', 'high_damage_next_double',
          `下一招威力翻倍`, 0, { threshold, damage: context.damage }));
      }
    } else if (context.timing === EffectTiming.BEFORE_DAMAGE_CALC) {
      const attacker = this.getAttacker(context);
      if (attacker.effectCounters?.nextAttackDouble) {
        context.damageMultiplier *= 2;
        attacker.effectCounters.nextAttackDouble = false;
        results.push(this.createResult(true, 'attacker', 'next_attack_double',
          `威力翻倍发动`, 0));
      }
    }
    return results;
  }
}

/**
 * 高伤回血 (2080)
 * 受到超过n的伤害时，恢复m体力
 * effectArgs: [threshold, healAmount]
 */
export class HighDamageHealPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'HighDamageHealPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const threshold = context.effectArgs?.[0] || 0;
    const healAmount = context.effectArgs?.[1] || 0;

    if (context.damage > threshold && healAmount > 0 && defender.hp > 0) {
      const oldHp = defender.hp;
      defender.hp = Math.min(defender.maxHp, defender.hp + healAmount);
      const actualHeal = defender.hp - oldHp;
      if (actualHeal > 0) {
        this.log(`高伤回血: 伤害 ${context.damage} > ${threshold}, 恢复 ${actualHeal} HP`, 'info');
        results.push(this.createResult(true, 'defender', 'high_damage_heal',
          `${defender.name} 恢复 ${actualHeal} HP`, actualHeal,
          { threshold, damage: context.damage }));
      }
    }
    return results;
  }
}

/**
 * 低血守护 (2081)
 * 体力低于n%时，每次受到伤害都会使自身进入山神守护状态，接下来m回合受到伤害减免90%
 * effectArgs: [hpPercent, duration]
 */
export class LowHpGuardianPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'LowHpGuardianPassive', [EffectTiming.AFTER_DAMAGE_APPLY, EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const hpPercent = context.effectArgs?.[0] || 0;
    const duration = context.effectArgs?.[1] || 0;

    if (!defender.effectCounters) defender.effectCounters = {};

    if (context.timing === EffectTiming.AFTER_DAMAGE_APPLY) {
      // 触发守护
      if (defender.hp > 0 && defender.maxHp > 0 && hpPercent > 0 &&
          (defender.hp / defender.maxHp * 100) < hpPercent && context.damage > 0) {
        defender.effectCounters.guardianTurns = duration;
        if (!defender.statusDurations) defender.statusDurations = new Array(20).fill(0);
        defender.statusDurations[12] = duration; // 12 = MOUNTAIN_GUARD
        defender.status = 12;
        defender.statusTurns = duration;

        this.log(`低血守护: ${defender.name} 进入山神守护 ${duration} 回合`, 'info');
        results.push(this.createResult(true, 'defender', 'low_hp_guardian',
          `${defender.name} 进入了山神守护状态`, 0,
          { hpPercent, duration }));
      }
    } else if (context.timing === EffectTiming.AFTER_DAMAGE_CALC) {
      // 守护减伤
      const guardianTurns = defender.effectCounters.guardianTurns || 0;
      if (guardianTurns > 0 && context.damage > 0) {
        const oldDamage = context.damage;
        context.damage = Math.max(1, Math.floor(context.damage * 0.1)); // 减免90%
        defender.effectCounters.guardianTurns = guardianTurns - 1;
        results.push(this.createResult(true, 'defender', 'guardian_reduction',
          `山神守护减免 90% 伤害`, oldDamage - context.damage,
          { remainTurns: guardianTurns - 1 }));
      }
    }
    return results;
  }
}
