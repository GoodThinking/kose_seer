import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 伤害增加 (2038)
 * 自身造成的伤害增加n%
 * effectArgs: [bonusPercent]
 */
export class DamageBonusPercentPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'DamageBonusPercentPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const bonusPercent = context.effectArgs?.[0] || 0;

    if (bonusPercent > 0) {
      context.damageMultiplier *= (1 + bonusPercent / 100);
      results.push(this.createResult(true, 'attacker', 'damage_bonus_percent',
        `伤害增加 ${bonusPercent}%`, bonusPercent));
    }
    return results;
  }
}

/**
 * 偶数伤害倍增 (2039)
 * 偶数伤害提升到n*dmg
 * effectArgs: [multiplier]
 */
export class EvenDamageMultiplyPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'EvenDamageMultiplyPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const multiplier = context.effectArgs?.[0] || 2;

    if (context.damage > 0 && context.damage % 2 === 0) {
      const oldDamage = context.damage;
      context.damage = Math.floor(context.damage * multiplier);
      this.log(`偶数伤害倍增: ${oldDamage} -> ${context.damage}`, 'info');
      results.push(this.createResult(true, 'attacker', 'even_damage_multiply',
        `偶数伤害提升至 ${multiplier} 倍`, context.damage - oldDamage,
        { multiplier, oldDamage }));
    }
    return results;
  }
}

/**
 * 奇数伤害削减 (2040)
 * 奇数伤害改为1/n*dmg
 * effectArgs: [divisor]
 */
export class OddDamageDividePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'OddDamageDividePassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const divisor = context.effectArgs?.[0] || 2;

    if (context.damage > 0 && context.damage % 2 === 1 && divisor > 0) {
      const oldDamage = context.damage;
      context.damage = Math.max(1, Math.floor(context.damage / divisor));
      this.log(`奇数伤害削减: ${oldDamage} -> ${context.damage}`, 'info');
      results.push(this.createResult(true, 'attacker', 'odd_damage_divide',
        `奇数伤害削减为 1/${divisor}`, oldDamage - context.damage,
        { divisor, oldDamage }));
    }
    return results;
  }
}

/**
 * 双方伤害降低 (2047)
 * 敌我双方伤害降低n%
 * effectArgs: [reducePercent]
 */
export class BothDamageReducePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BothDamageReducePassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const reducePercent = context.effectArgs?.[0] || 0;

    if (context.damage > 0 && reducePercent > 0) {
      const oldDamage = context.damage;
      context.damage = Math.max(1, Math.floor(context.damage * (1 - reducePercent / 100)));
      results.push(this.createResult(true, 'both', 'both_damage_reduce',
        `双方伤害降低 ${reducePercent}%`, oldDamage - context.damage,
        { reducePercent }));
    }
    return results;
  }
}

/**
 * 双方伤害倍增 (2055)
 * 每回合敌我双方造成的伤害为原来的n倍
 * effectArgs: [multiplier]
 */
export class BothDamageMultiplyPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BothDamageMultiplyPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const multiplier = context.effectArgs?.[0] || 2;

    if (context.damage > 0 && multiplier > 1) {
      const oldDamage = context.damage;
      context.damage = Math.floor(context.damage * multiplier);
      results.push(this.createResult(true, 'both', 'both_damage_multiply',
        `双方伤害倍增至 ${multiplier} 倍`, context.damage - oldDamage,
        { multiplier }));
    }
    return results;
  }
}

/**
 * 概率减伤 (2060)
 * 受到攻击时n%几率使受到的伤害降低m点
 * effectArgs: [chance, reduceAmount]
 */
export class ChanceDamageFlatReducePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'ChanceDamageFlatReducePassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const chance = context.effectArgs?.[0] || 0;
    const reduceAmount = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && reduceAmount > 0 && this.checkProbability(chance)) {
      const oldDamage = context.damage;
      context.damage = Math.max(1, context.damage - reduceAmount);
      this.log(`概率减伤: ${oldDamage} -> ${context.damage}`, 'info');
      results.push(this.createResult(true, 'defender', 'chance_damage_reduce',
        `伤害降低 ${reduceAmount} 点`, oldDamage - context.damage,
        { chance, reduceAmount }));
    }
    return results;
  }
}

/**
 * 概率完全抵挡 (2061)
 * n%几率完全抵挡一次伤害
 * effectArgs: [chance]
 */
export class ChanceFullBlockPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'ChanceFullBlockPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const chance = context.effectArgs?.[0] || 0;

    if (context.damage > 0 && this.checkProbability(chance)) {
      const blockedDamage = context.damage;
      context.damage = 0;
      context.isBlocked = true;
      this.log(`概率完全抵挡: 抵挡 ${blockedDamage} 伤害`, 'info');
      results.push(this.createResult(true, 'defender', 'chance_full_block',
        `完全抵挡了攻击`, blockedDamage, { chance }));
    }
    return results;
  }
}

/**
 * 物攻概率加伤 (2062)
 * 物理攻击有n%几率使伤害提高m点
 * effectArgs: [chance, bonusAmount]
 */
export class PhysChanceDamageBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'PhysChanceDamageBonusPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const chance = context.effectArgs?.[0] || 0;
    const bonusAmount = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && context.skillCategory === 1 && bonusAmount > 0 && this.checkProbability(chance)) {
      context.damage += bonusAmount;
      results.push(this.createResult(true, 'attacker', 'phys_chance_damage_bonus',
        `物理攻击伤害增加 ${bonusAmount}`, bonusAmount, { chance }));
    }
    return results;
  }
}

/**
 * 特攻概率加伤 (2063)
 * 特殊攻击有n%几率使伤害提高m点
 * effectArgs: [chance, bonusAmount]
 */
export class SpChanceDamageBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SpChanceDamageBonusPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const chance = context.effectArgs?.[0] || 0;
    const bonusAmount = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && context.skillCategory === 2 && bonusAmount > 0 && this.checkProbability(chance)) {
      context.damage += bonusAmount;
      results.push(this.createResult(true, 'attacker', 'sp_chance_damage_bonus',
        `特殊攻击伤害增加 ${bonusAmount}`, bonusAmount, { chance }));
    }
    return results;
  }
}

/**
 * 物攻或特攻加伤 (2065)
 * 物理攻击或特殊攻击伤害增加m%
 * effectArgs: [attackType, bonusPercent] (attackType: 1=物理, 3=特殊)
 */
export class AttackTypeDamageBonusPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'AttackTypeDamageBonusPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attackType = context.effectArgs?.[0] || 1;
    const bonusPercent = context.effectArgs?.[1] || 0;

    // attackType 1=物理对应skillCategory 1, attackType 3=特殊对应skillCategory 2
    const targetCategory = attackType === 3 ? 2 : attackType;

    if (context.skillCategory === targetCategory && bonusPercent > 0) {
      context.damageMultiplier *= (1 + bonusPercent / 100);
      results.push(this.createResult(true, 'attacker', 'attack_type_damage_bonus',
        `攻击伤害增加 ${bonusPercent}%`, bonusPercent,
        { attackType, bonusPercent }));
    }
    return results;
  }
}

/**
 * 自身伤害削减 (2076)
 * 减少自身n%的攻击伤害
 * effectArgs: [reducePercent]
 */
export class SelfDamageReducePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SelfDamageReducePassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const reducePercent = context.effectArgs?.[0] || 0;

    if (context.damage > 0 && reducePercent > 0) {
      const oldDamage = context.damage;
      context.damage = Math.max(1, Math.floor(context.damage * (1 - reducePercent / 100)));
      results.push(this.createResult(true, 'attacker', 'self_damage_reduce',
        `自身伤害削减 ${reducePercent}%`, oldDamage - context.damage,
        { reducePercent }));
    }
    return results;
  }
}
