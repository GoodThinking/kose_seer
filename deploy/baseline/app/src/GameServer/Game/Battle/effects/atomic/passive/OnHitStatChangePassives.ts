import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 受特攻提升能力 (2012)
 * 受到特殊攻击时使自身的一种battle_lv提升1个等级，可提升n次
 * effectArgs: [statIndex, maxTimes]
 */
export class OnSpHitStatUpPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'OnSpHitStatUpPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const statIndex = context.effectArgs?.[0] || 0;
    const maxTimes = context.effectArgs?.[1] || 6;

    if (context.damage > 0 && context.skillCategory === 2) {
      if (!defender.effectCounters) defender.effectCounters = {};
      const key = `on_sp_hit_stat_up_${statIndex}`;
      const count = defender.effectCounters[key] || 0;

      if (count < maxTimes && defender.battleLv) {
        defender.battleLv[statIndex] = Math.min(12, (defender.battleLv[statIndex] || 6) + 1);
        defender.effectCounters[key] = count + 1;
        this.log(`受特攻提升能力: ${defender.name} 能力${statIndex}提升 (${count + 1}/${maxTimes})`, 'info');
        results.push(this.createResult(true, 'defender', 'stat_up',
          `${defender.name} 能力等级提升`, 1,
          { statIndex, count: count + 1, maxTimes }));
      }
    }
    return results;
  }
}

/**
 * 受特攻降对方能力 (2034)
 * 受到特殊攻击时有n%几率使对方battle_lv降低1个等级
 * effectArgs: [statIndex, chance]
 */
export class OnSpHitEnemyStatDownPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'OnSpHitEnemyStatDownPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const statIndex = context.effectArgs?.[0] || 0;
    const chance = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && context.skillCategory === 2 && this.checkProbability(chance)) {
      if (attacker.battleLv) {
        attacker.battleLv[statIndex] = Math.max(0, (attacker.battleLv[statIndex] || 6) - 1);
        this.log(`受特攻降对方能力: ${attacker.name} 能力${statIndex}降低`, 'info');
        results.push(this.createResult(true, 'attacker', 'stat_down',
          `${attacker.name} 能力等级降低`, -1,
          { statIndex, chance }));
      }
    }
    return results;
  }
}

/**
 * 受击自身提升能力 (2035)
 * 受到任何攻击时有n%几率使自身battle_lv提升1个等级
 * effectArgs: [statIndex, chance]
 */
export class OnHitSelfStatUpPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'OnHitSelfStatUpPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const statIndex = context.effectArgs?.[0] || 0;
    const chance = context.effectArgs?.[1] || 0;

    if (context.damage > 0 && this.checkProbability(chance)) {
      if (defender.battleLv) {
        defender.battleLv[statIndex] = Math.min(12, (defender.battleLv[statIndex] || 6) + 1);
        this.log(`受击自身提升能力: ${defender.name} 能力${statIndex}提升`, 'info');
        results.push(this.createResult(true, 'defender', 'stat_up',
          `${defender.name} 能力等级提升`, 1,
          { statIndex, chance }));
      }
    }
    return results;
  }
}
