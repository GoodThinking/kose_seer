import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 同系吸收被动效果
 * BOSS特性4: 受到与自身相同系属的攻击会恢复自身相应体力
 * 
 * 实现方式：
 * - 在伤害计算后检查攻击属性
 * - 如果攻击属性与防御方属性相同，将伤害转换为治疗
 */
export class SameTypeAbsorbPassive extends BaseAtomicEffect {
  constructor() {
    super(
      'heal' as AtomicEffectType,
      'SameTypeAbsorbPassive',
      [EffectTiming.AFTER_DAMAGE_CALC]
    );
  }

  public validate(params: any): boolean {
    return true; // 无参数，总是有效
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const skillType = context.skillType;

    // 检查技能属性是否与防御方属性相同
    if (skillType === defender.type && context.damage && context.damage > 0) {
      const healAmount = context.damage;
      
      // 将伤害转换为治疗
      context.damage = 0; // 取消伤害
      
      // 恢复体力（不超过最大值）
      const oldHp = defender.hp;
      defender.hp = Math.min(defender.maxHp, defender.hp + healAmount);
      const actualHeal = defender.hp - oldHp;

      this.log(
        `精灵 ${defender.name} 吸收同系攻击: 恢复 ${actualHeal} HP`,
        'info'
      );

      results.push(
        this.createResult(
          true,
          'defender',
          'heal',
          `${defender.name} 吸收了同系攻击，恢复 ${actualHeal} HP`,
          actualHeal,
          { 
            absorbedDamage: healAmount,
            skillType: skillType,
            defenderType: defender.type
          }
        )
      );
    }

    return results;
  }
}
