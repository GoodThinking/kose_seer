import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

/**
 * 轮换免疫 (2052)
 * 第3n+1回合免疫特殊攻击，第3n+2回合免疫物理攻击，第3n+3回合免疫属性攻击
 */
export class RotatingAttackImmunityPassive extends BaseAtomicEffect {
  constructor(params: any = {}) {
    super('special' as AtomicEffectType, 'RotatingAttackImmunityPassive', [EffectTiming.BEFORE_DAMAGE_CALC]);
  }

  public validate(params: any): boolean { return true; }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const turnMod = ((context.turn - 1) % 3) + 1;

    // 3n+1: 免疫特殊(2), 3n+2: 免疫物理(1), 3n+3: 免疫变化(3)
    let immuneCategory = 0;
    if (turnMod === 1) immuneCategory = 2;
    else if (turnMod === 2) immuneCategory = 1;
    else immuneCategory = 3;

    if (context.skillCategory === immuneCategory && context.damage > 0) {
      context.damage = 0;
      context.isBlocked = true;
      const categoryNames: { [key: number]: string } = { 1: '物理', 2: '特殊', 3: '变化' };
      this.log(`轮换免疫: 回合${context.turn} 免疫${categoryNames[immuneCategory]}攻击`, 'info');
      results.push(this.createResult(true, 'defender', 'rotating_immunity',
        `本回合免疫${categoryNames[immuneCategory]}攻击`, 0,
        { turn: context.turn, immuneCategory }));
    }
    return results;
  }
}
