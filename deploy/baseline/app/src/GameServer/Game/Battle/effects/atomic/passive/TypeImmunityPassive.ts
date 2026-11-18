import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 属性免疫被动效果
 * BOSS特性5: 只受到来自普通属性和某类属性的攻击伤害（其他属性免疫）
 * 
 * 参数：
 * - allowedType1-8: 允许的属性类型（mon_type: 1-26），0表示无
 * 
 * 实现方式：
 * - 在伤害计算后检查攻击属性
 * - 如果攻击属性不在允许列表中，将伤害设为0
 */
export class TypeImmunityPassive extends BaseAtomicEffect {
  private allowedTypes: Set<number>;

  constructor(params: any = {}) {
    super(
      'immunity' as AtomicEffectType,
      'TypeImmunityPassive',
      [EffectTiming.AFTER_DAMAGE_CALC]
    );

    // 解析允许的属性类型
    this.allowedTypes = new Set<number>();
    
    // 默认允许普通属性(8)
    this.allowedTypes.add(8);

    // 从参数中添加其他允许的属性
    for (let i = 1; i <= 8; i++) {
      const typeKey = `allowedType${i}`;
      const typeValue = params[typeKey];
      if (typeValue && typeValue > 0) {
        this.allowedTypes.add(typeValue);
      }
    }

    // 如果params中有typeList，也添加进来
    if (params.typeList && Array.isArray(params.typeList)) {
      params.typeList.forEach((type: number) => {
        if (type > 0) {
          this.allowedTypes.add(type);
        }
      });
    }
  }

  public validate(params: any): boolean {
    // 至少要有一个允许的属性类型
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);
    const skillType = context.skillType;

    // 检查技能属性是否在允许列表中
    if (context.damage && context.damage > 0) {
      if (!this.allowedTypes.has(skillType)) {
        const blockedDamage = context.damage;
        context.damage = 0; // 免疫伤害

        this.log(
          `精灵 ${defender.name} 免疫属性攻击: 属性=${skillType}, 允许属性=[${Array.from(this.allowedTypes).join(',')}]`,
          'info'
        );

        results.push(
          this.createResult(
            true,
            'defender',
            'immunity',
            `${defender.name} 免疫了 ${skillType} 属性的攻击`,
            blockedDamage,
            { 
              blockedDamage,
              skillType,
              allowedTypes: Array.from(this.allowedTypes)
            }
          )
        );
      }
    }

    return results;
  }
}
