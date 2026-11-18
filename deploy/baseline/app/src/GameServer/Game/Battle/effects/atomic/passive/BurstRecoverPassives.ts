import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 濒死回满 (2009)
 * 如果被打到BurstRecoverHP以下且没有挂掉则马上恢复到满HP
 * effectArgs: [burstHpHigh, burstHpLow] (组合为32位阈值)
 */
export class BurstRecoverFullHpPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BurstRecoverFullHpPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const burstHpHigh = context.effectArgs?.[0] || 0;
    const burstHpLow = context.effectArgs?.[1] || 0;
    const threshold = (burstHpHigh << 16) | burstHpLow;

    if (defender.hp > 0 && defender.hp <= threshold) {
      const oldHp = defender.hp;
      defender.hp = defender.maxHp;
      this.log(`濒死回满: ${defender.name} HP ${oldHp} -> ${defender.maxHp}`, 'info');
      results.push(this.createResult(true, 'defender', 'burst_recover',
        `${defender.name} 濒死回满，HP恢复至 ${defender.maxHp}`, defender.maxHp - oldHp,
        { threshold, oldHp }));
    }
    return results;
  }
}

/**
 * 濒死回满含PP (2051)
 * 如果被打到BurstRecoverHP以下且没有挂掉则马上恢复到满HP和PP值
 * effectArgs: [burstHpHigh, burstHpLow]
 */
export class BurstRecoverFullHpPpPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BurstRecoverFullHpPpPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const burstHpHigh = context.effectArgs?.[0] || 0;
    const burstHpLow = context.effectArgs?.[1] || 0;
    const threshold = (burstHpHigh << 16) | burstHpLow;

    if (defender.hp > 0 && defender.hp <= threshold) {
      const oldHp = defender.hp;
      defender.hp = defender.maxHp;

      // 恢复PP
      if (defender.skillPP) {
        for (let i = 0; i < defender.skillPP.length; i++) {
          defender.skillPP[i] = 99;
        }
      }

      this.log(`濒死回满含PP: ${defender.name} HP和PP全恢复`, 'info');
      results.push(this.createResult(true, 'defender', 'burst_recover_pp',
        `${defender.name} 濒死回满，HP和PP全恢复`, defender.maxHp - oldHp,
        { threshold, oldHp, ppRestored: true }));
    }
    return results;
  }
}
