import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 受伤减免被动效果
 * BOSS特性3: 受到任何伤害减免n%
 * 
 * 参数：
 * - reductionPercent: 伤害减免百分比（0-100）
 * 
 * 实现方式：
 * - 在伤害计算后修改最终伤害值
 * - 伤害 = 原伤害 * (1 - reductionPercent / 100)
 */
export class DamageReductionPassive extends BaseAtomicEffect {
  private reductionPercent: number;

  constructor(params: any = {}) {
    super(
      'damage_modifier' as AtomicEffectType,
      'DamageReductionPassive',
      [EffectTiming.AFTER_DAMAGE_CALC]
    );
    this.reductionPercent = params.reductionPercent || params.value || 50;
  }

  public validate(params: any): boolean {
    const percent = params.reductionPercent || params.value;
    if (percent === undefined) return true; // 使用默认值
    return percent >= 0 && percent <= 100;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    // 只在防御方受到伤害时触发
    if (context.damage && context.damage > 0) {
      const originalDamage = context.damage;
      const reduction = Math.floor(originalDamage * this.reductionPercent / 100);
      const newDamage = Math.max(1, originalDamage - reduction); // 至少造成1点伤害

      // 修改上下文中的伤害值
      context.damage = newDamage;

      this.log(
        `精灵 ${defender.name} 触发伤害减免: ${originalDamage} -> ${newDamage} (减免${this.reductionPercent}%)`,
        'info'
      );

      results.push(
        this.createResult(
          true,
          'defender',
          'damage_reduction',
          `${defender.name} 减免了 ${reduction} 点伤害`,
          reduction,
          { 
            originalDamage,
            newDamage,
            reductionPercent: this.reductionPercent
          }
        )
      );
    }

    return results;
  }
}
