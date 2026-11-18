import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 每回合回血 (2041)
 * 每回合恢复自身n点体力
 * effectArgs: [healAmount]
 */
export class TurnEndHealPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'TurnEndHealPassive', [EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const healAmount = context.effectArgs?.[0] || 0;

    if (healAmount > 0 && attacker.hp > 0) {
      const oldHp = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
      const actualHeal = attacker.hp - oldHp;
      if (actualHeal > 0) {
        results.push(this.createResult(true, 'attacker', 'turn_end_heal',
          `${attacker.name} 恢复 ${actualHeal} HP`, actualHeal));
      }
    }
    return results;
  }
}

/**
 * 双方回血 (2053)
 * 敌我双方每回合恢复n%HP
 * effectArgs: [healPercent]
 */
export class BothTurnHealPercentPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BothTurnHealPercentPassive', [EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const healPercent = context.effectArgs?.[0] || 0;

    if (healPercent > 0) {
      for (const pet of [attacker, defender]) {
        if (pet.hp > 0) {
          const healAmount = Math.floor(pet.maxHp * healPercent / 100);
          const oldHp = pet.hp;
          pet.hp = Math.min(pet.maxHp, pet.hp + healAmount);
          const actualHeal = pet.hp - oldHp;
          if (actualHeal > 0) {
            const target = pet === attacker ? 'attacker' : 'defender';
            results.push(this.createResult(true, target as any, 'both_turn_heal',
              `${pet.name} 恢复 ${actualHeal} HP`, actualHeal, { healPercent }));
          }
        }
      }
    }
    return results;
  }
}

/**
 * 双方扣血 (2054)
 * 每回合结束后，敌我双方扣除n体力值
 * effectArgs: [damageAmount]
 */
export class BothTurnDamagePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BothTurnDamagePassive', [EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const damageAmount = context.effectArgs?.[0] || 0;

    if (damageAmount > 0) {
      for (const pet of [attacker, defender]) {
        if (pet.hp > 0) {
          pet.hp = Math.max(0, pet.hp - damageAmount);
          const target = pet === attacker ? 'attacker' : 'defender';
          results.push(this.createResult(true, target as any, 'both_turn_damage',
            `${pet.name} 损失 ${damageAmount} HP`, damageAmount));
        }
      }
    }
    return results;
  }
}

/**
 * 回合吸血 (2071)
 * 每回合结束时，对手降低n体力，自身恢复m体力
 * effectArgs: [enemyDamage, selfHeal]
 */
export class TurnDrainPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'TurnDrainPassive', [EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const enemyDamage = context.effectArgs?.[0] || 0;
    const selfHeal = context.effectArgs?.[1] || 0;

    if (defender.hp > 0 && enemyDamage > 0) {
      defender.hp = Math.max(0, defender.hp - enemyDamage);
      results.push(this.createResult(true, 'defender', 'turn_drain_damage',
        `${defender.name} 损失 ${enemyDamage} HP`, enemyDamage));
    }

    if (attacker.hp > 0 && selfHeal > 0) {
      const oldHp = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + selfHeal);
      const actualHeal = attacker.hp - oldHp;
      if (actualHeal > 0) {
        results.push(this.createResult(true, 'attacker', 'turn_drain_heal',
          `${attacker.name} 恢复 ${actualHeal} HP`, actualHeal));
      }
    }
    return results;
  }
}

/**
 * 差异回血 (2075)
 * 每回合敌方恢复m%HP，我方恢复n%HP
 * effectArgs: [enemyHealPercent, selfHealPercent]
 */
export class AsymmetricTurnHealPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'AsymmetricTurnHealPassive', [EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);
    const enemyHealPercent = context.effectArgs?.[0] || 0;
    const selfHealPercent = context.effectArgs?.[1] || 0;

    if (defender.hp > 0 && enemyHealPercent > 0) {
      const healAmount = Math.floor(defender.maxHp * enemyHealPercent / 100);
      const oldHp = defender.hp;
      defender.hp = Math.min(defender.maxHp, defender.hp + healAmount);
      const actualHeal = defender.hp - oldHp;
      if (actualHeal > 0) {
        results.push(this.createResult(true, 'defender', 'asymmetric_heal',
          `${defender.name} 恢复 ${actualHeal} HP`, actualHeal, { healPercent: enemyHealPercent }));
      }
    }

    if (attacker.hp > 0 && selfHealPercent > 0) {
      const healAmount = Math.floor(attacker.maxHp * selfHealPercent / 100);
      const oldHp = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
      const actualHeal = attacker.hp - oldHp;
      if (actualHeal > 0) {
        results.push(this.createResult(true, 'attacker', 'asymmetric_heal',
          `${attacker.name} 恢复 ${actualHeal} HP`, actualHeal, { healPercent: selfHealPercent }));
      }
    }
    return results;
  }
}

/**
 * 每回合扣敌血 (2077)
 * 每回合损失对手n点体力
 * effectArgs: [damageAmount]
 */
export class TurnEnemyDamagePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'TurnEnemyDamagePassive', [EffectTiming.TURN_END]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const damageAmount = context.effectArgs?.[0] || 0;

    if (damageAmount > 0 && defender.hp > 0) {
      defender.hp = Math.max(0, defender.hp - damageAmount);
      results.push(this.createResult(true, 'defender', 'turn_enemy_damage',
        `${defender.name} 损失 ${damageAmount} HP`, damageAmount));
    }
    return results;
  }
}
