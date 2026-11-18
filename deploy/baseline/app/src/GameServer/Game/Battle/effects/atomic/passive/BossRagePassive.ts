import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 魔王愤怒 (2058)
 * 按一定条件触发魔王的愤怒，触发时战斗等级提升至一定状态
 * effectArgs: [atkLevel, defLevel, spAtkLevel, spDefLevel, spdLevel, accLevel]
 * -1表示不设置
 */
export class BossRagePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BossRagePassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    if (!defender.effectCounters) defender.effectCounters = {};
    if (defender.effectCounters.bossRageTriggered) return results;

    // 触发条件：HP低于50%
    if (defender.hp > 0 && defender.maxHp > 0 && defender.hp < defender.maxHp * 0.5) {
      const levels = context.effectArgs || [];
      if (defender.battleLv) {
        for (let i = 0; i < 6 && i < levels.length; i++) {
          if (levels[i] >= 0) {
            defender.battleLv[i] = levels[i];
          }
        }
      }

      defender.effectCounters.bossRageTriggered = true;
      this.log(`魔王愤怒: ${defender.name} 触发愤怒，能力等级提升`, 'info');
      results.push(this.createResult(true, 'defender', 'boss_rage',
        `${defender.name} 触发了魔王愤怒！`, 0,
        { levels: levels.slice(0, 6) }));
    }
    return results;
  }
}
