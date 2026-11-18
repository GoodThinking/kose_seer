import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 魔王附身 (2059)
 * 按一定条件触发魔王的附身，触发时受到伤害时n回合内反弹m%伤害给玩家
 * effectArgs: [duration, reflectPercent]
 */
export class BossPossessionPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'BossPossessionPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const attacker = this.getAttacker(context);
    const duration = context.effectArgs?.[0] || 0;
    const reflectPercent = context.effectArgs?.[1] || 0;

    if (!defender.effectCounters) defender.effectCounters = {};

    // 检查是否已在附身状态
    const possessionTurns = defender.effectCounters.possessionTurns || 0;
    if (possessionTurns > 0 && context.damage > 0) {
      // 附身状态下反弹伤害
      const reflectDamage = Math.floor(context.damage * reflectPercent / 100);
      if (reflectDamage > 0) {
        attacker.hp = Math.max(0, attacker.hp - reflectDamage);
        defender.effectCounters.possessionTurns = possessionTurns - 1;
        results.push(this.createResult(true, 'attacker', 'possession_reflect',
          `魔王附身反弹 ${reflectDamage} 伤害`, reflectDamage,
          { remainTurns: possessionTurns - 1 }));
      }
      return results;
    }

    // 触发条件：HP低于30%
    if (!defender.effectCounters.possessionTriggered &&
        defender.hp > 0 && defender.maxHp > 0 && defender.hp < defender.maxHp * 0.3) {
      defender.effectCounters.possessionTriggered = true;
      defender.effectCounters.possessionTurns = duration;
      this.log(`魔王附身: ${defender.name} 触发附身 ${duration} 回合`, 'info');
      results.push(this.createResult(true, 'defender', 'boss_possession',
        `${defender.name} 触发了魔王附身！`, 0,
        { duration, reflectPercent }));
    }
    return results;
  }
}
