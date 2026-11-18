import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 属性秒杀 (2205)
 * 遇到指定精灵属性，所有技能必定秒杀
 * effectArgs: [type1, type2, ..., type8]
 */
export class TypeOhkoPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'TypeOhkoPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const targetTypes = (context.effectArgs || []).filter(t => t > 0);

    if (targetTypes.includes(defender.type)) {
      context.instantKill = true;
      context.damage = defender.hp;
      this.log(`属性秒杀: 目标属性 ${defender.type} 在秒杀列表中`, 'info');
      results.push(this.createResult(true, 'attacker', 'instant_kill',
        `对属性 ${defender.type} 发动秒杀`, defender.hp,
        { targetTypes, defenderType: defender.type }));
    }
    return results;
  }
}
