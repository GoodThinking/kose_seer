import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 定时秒杀 (2056)
 * 第n回合秒杀敌人
 * effectArgs: [turnNumber]
 */
export class TimedOhkoPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'TimedOhkoPassive', [EffectTiming.TURN_START]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const turnNumber = context.effectArgs?.[0] || 0;

    if (turnNumber > 0 && context.turn === turnNumber && defender.hp > 0) {
      defender.hp = 0;
      this.log(`定时秒杀: 第 ${turnNumber} 回合秒杀 ${defender.name}`, 'info');
      results.push(this.createResult(true, 'defender', 'timed_ohko',
        `第 ${turnNumber} 回合秒杀 ${defender.name}`, defender.maxHp,
        { turnNumber }));
    }
    return results;
  }
}
