import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 命中消回合效果 (2772)
 * 技能命中前消除对手回合类效果
 */
export class ClearEnemyTurnEffectsPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'ClearEnemyTurnEffectsPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    // 清除对手的回合类效果
    if (defender.effectCounters) {
      const turnEffectKeys = Object.keys(defender.effectCounters).filter(key =>
        key.includes('Turns') || key.includes('turns') || key.includes('duration')
      );

      for (const key of turnEffectKeys) {
        defender.effectCounters[key] = 0;
      }

      if (turnEffectKeys.length > 0) {
        this.log(`命中消回合效果: 清除 ${defender.name} 的 ${turnEffectKeys.length} 个回合效果`, 'info');
        results.push(this.createResult(true, 'defender', 'clear_turn_effects',
          `清除了 ${defender.name} 的回合类效果`, turnEffectKeys.length,
          { clearedKeys: turnEffectKeys }));
      }
    }
    return results;
  }
}
