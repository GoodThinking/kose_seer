import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 复制强化 (2070)
 * 对手的能力提升效果会同时作用到自己身上
 */
export class CopyEnemyBuffPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'CopyEnemyBuffPassive', [EffectTiming.AFTER_SKILL]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);

    if (!attacker.effectCounters) attacker.effectCounters = {};
    if (!defender.effectCounters) defender.effectCounters = {};

    // 记录对手的能力等级变化并复制
    if (defender.battleLv && attacker.battleLv) {
      const prevLevels = attacker.effectCounters.prevEnemyLevels || [...defender.battleLv];
      let copied = false;

      for (let i = 0; i < 6; i++) {
        const diff = (defender.battleLv[i] || 6) - (prevLevels[i] || 6);
        if (diff > 0) {
          // 对手能力提升了，复制到自身
          attacker.battleLv[i] = Math.min(12, (attacker.battleLv[i] || 6) + diff);
          copied = true;
        }
      }

      // 更新记录
      attacker.effectCounters.prevEnemyLevels = [...defender.battleLv];

      if (copied) {
        this.log(`复制强化: ${attacker.name} 复制了对手的能力提升`, 'info');
        results.push(this.createResult(true, 'attacker', 'copy_enemy_buff',
          `${attacker.name} 复制了对手的能力提升`, 0));
      }
    }
    return results;
  }
}
