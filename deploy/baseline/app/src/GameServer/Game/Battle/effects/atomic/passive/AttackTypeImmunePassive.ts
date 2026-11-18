import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 攻击类型无效 (2048)
 * 对方某种攻击类型无效
 * effectArgs: [attackType] (1=物理, 2=特殊, 3=变化)
 */
export class AttackTypeImmunePassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'AttackTypeImmunePassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attackType = context.effectArgs?.[0] || 0;

    if (attackType > 0 && context.skillCategory === attackType) {
      context.damage = 0;
      context.isBlocked = true;
      this.log(`攻击类型无效: 类型 ${attackType} 被免疫`, 'info');
      results.push(this.createResult(true, 'defender', 'attack_type_immune',
        `免疫了该类型的攻击`, 0, { attackType }));
    }
    return results;
  }
}
