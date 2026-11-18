import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 血量绑定能力 (2016)
 * HP与battle_lv的某一种绑定，自身体力每减少1/8则该battle_lv上升1个等级，最高到12
 * effectArgs: [statIndex]
 */
export class HpStatBindPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'HpStatBindPassive', [EffectTiming.AFTER_DAMAGE_APPLY]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const statIndex = context.effectArgs?.[0] || 0;

    if (context.damage > 0 && defender.battleLv && defender.maxHp > 0) {
      // 计算已损失HP对应的等级
      const hpLostRatio = (defender.maxHp - defender.hp) / defender.maxHp;
      const targetLevel = Math.min(12, Math.floor(hpLostRatio * 8) + 6);
      const currentLevel = defender.battleLv[statIndex] || 6;

      if (targetLevel > currentLevel) {
        defender.battleLv[statIndex] = targetLevel;
        this.log(`血量绑定能力: ${defender.name} 能力${statIndex} -> ${targetLevel}`, 'info');
        results.push(this.createResult(true, 'defender', 'hp_stat_bind',
          `${defender.name} 能力等级提升至 ${targetLevel}`, targetLevel - currentLevel,
          { statIndex, hpLostRatio, targetLevel }));
      }
    }
    return results;
  }
}
