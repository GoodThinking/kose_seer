import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 死亡回血 (2025)
 * 如果HP被打成0，则立刻增加一些HP
 */
export class ReviveOnDeathPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'ReviveOnDeathPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    if (defender.hp <= 0) {
      if (!defender.effectCounters) defender.effectCounters = {};
      if (defender.effectCounters.reviveOnDeathUsed) return results;

      const healAmount = Math.floor(defender.maxHp * 0.25);
      defender.hp = healAmount;
      defender.effectCounters.reviveOnDeathUsed = true;

      this.log(`死亡回血: ${defender.name} 恢复 ${healAmount} HP`, 'info');
      results.push(this.createResult(true, 'defender', 'revive_on_death',
        `${defender.name} 死亡后恢复了 ${healAmount} HP`, healAmount));
    }
    return results;
  }
}

/**
 * 重生 (2044)
 * 重生(HP和btl_maxhp恢复到maxhp+maxhp_adj，技能PP值回满)
 * effectArgs: [maxRevives]
 */
export class ReviveFullPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'ReviveFullPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const maxRevives = context.effectArgs?.[0] || 1;

    if (defender.hp <= 0) {
      if (!defender.effectCounters) defender.effectCounters = {};
      const reviveCount = defender.effectCounters.reviveCount || 0;

      if (reviveCount < maxRevives) {
        defender.hp = defender.maxHp;
        defender.effectCounters.reviveCount = reviveCount + 1;

        // 恢复PP
        if (defender.skillPP) {
          for (let i = 0; i < defender.skillPP.length; i++) {
            defender.skillPP[i] = 99;
          }
        }

        this.log(`重生: ${defender.name} 完全重生 (${reviveCount + 1}/${maxRevives})`, 'info');
        results.push(this.createResult(true, 'defender', 'revive_full',
          `${defender.name} 重生了！HP和PP全恢复`, defender.maxHp,
          { reviveCount: reviveCount + 1, maxRevives }));
      }
    }
    return results;
  }
}
