import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 致死余1 (2021)
 * 除ID为xxx的技能外，任何能将自身体力降为0的技能都会使自身余下1体力
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
export class SurviveWith1HpPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SurviveWith1HpPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const exceptSkills = (context.effectArgs || []).filter(id => id > 0);

    // 如果是例外技能，不触发
    if (exceptSkills.includes(context.skillId)) return results;

    // 如果伤害会致死
    if (context.damage >= defender.hp && defender.hp > 0) {
      context.damage = defender.hp - 1;
      this.log(`致死余1: ${defender.name} 余下1HP`, 'info');
      results.push(this.createResult(true, 'defender', 'survive_1hp',
        `${defender.name} 顽强地余下了1点体力`, 1,
        { exceptSkills }));
    }
    return results;
  }
}

/**
 * 致死存活 (2031)
 * 受到致死攻击时有n%几率余下m点体力
 * effectArgs: [chance, remainHp]
 */
export class SurviveLethalChancePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'SurviveLethalChancePassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const chance = context.effectArgs?.[0] || 0;
    const remainHp = context.effectArgs?.[1] || 1;

    if (context.damage >= defender.hp && defender.hp > 0 && this.checkProbability(chance)) {
      context.damage = defender.hp - remainHp;
      this.log(`致死存活: ${defender.name} 余下 ${remainHp} HP`, 'info');
      results.push(this.createResult(true, 'defender', 'survive_lethal',
        `${defender.name} 幸运地余下了 ${remainHp} 点体力`, remainHp,
        { chance, remainHp }));
    }
    return results;
  }
}

/**
 * 五回合不死 (2046)
 * 若自身5回合内体力被降到0会余下1点体力，并且体力全恢复，恢复后回合数重新计算
 */
export class FiveTurnImmortalPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'FiveTurnImmortalPassive', [EffectTiming.AFTER_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    if (!defender.effectCounters) defender.effectCounters = {};
    const cycleStart = defender.effectCounters.immortalCycleStart || 1;
    const turnsInCycle = context.turn - cycleStart + 1;

    if (turnsInCycle <= 5 && context.damage >= defender.hp && defender.hp > 0) {
      context.damage = defender.hp - 1;
      // 全恢复并重置周期
      defender.hp = defender.maxHp;
      defender.effectCounters.immortalCycleStart = context.turn + 1;

      this.log(`五回合不死: ${defender.name} 全恢复，重置周期`, 'info');
      results.push(this.createResult(true, 'defender', 'five_turn_immortal',
        `${defender.name} 在不死周期内，体力全恢复`, defender.maxHp,
        { turnsInCycle, cycleStart }));
    }
    return results;
  }
}
