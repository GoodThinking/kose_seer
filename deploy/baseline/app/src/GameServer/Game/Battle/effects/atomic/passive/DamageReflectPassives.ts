import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 伤害反弹 (2011)
 * 受到任何攻击都会反弹1/n的伤害给对方
 * effectArgs: [divisor]
 */
export class DamageReflectFractionPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'DamageReflectFractionPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const divisor = context.effectArgs?.[0] || 4;

    if (context.damage > 0 && divisor > 0) {
      const reflectDamage = Math.floor(context.damage / divisor);
      if (reflectDamage > 0) {
        attacker.hp = Math.max(0, attacker.hp - reflectDamage);
        this.log(`伤害反弹: 反弹 ${reflectDamage} 伤害给 ${attacker.name}`, 'info');
        results.push(this.createResult(true, 'attacker', 'damage_reflect',
          `反弹了 ${reflectDamage} 点伤害`, reflectDamage,
          { divisor, originalDamage: context.damage }));
      }
    }
    return results;
  }
}

/**
 * 高伤反弹 (2083)
 * 受到超过n的伤害时，反弹m%伤害
 * effectArgs: [threshold, reflectPercent]
 */
export class HighDamageReflectPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'HighDamageReflectPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const threshold = context.effectArgs?.[0] || 0;
    const reflectPercent = context.effectArgs?.[1] || 0;

    if (context.damage > threshold && reflectPercent > 0) {
      const reflectDamage = Math.floor(context.damage * reflectPercent / 100);
      if (reflectDamage > 0) {
        attacker.hp = Math.max(0, attacker.hp - reflectDamage);
        this.log(`高伤反弹: 伤害 ${context.damage} > ${threshold}, 反弹 ${reflectDamage}`, 'info');
        results.push(this.createResult(true, 'attacker', 'high_damage_reflect',
          `反弹了 ${reflectDamage} 点伤害`, reflectDamage,
          { threshold, reflectPercent, originalDamage: context.damage }));
      }
    }
    return results;
  }
}
