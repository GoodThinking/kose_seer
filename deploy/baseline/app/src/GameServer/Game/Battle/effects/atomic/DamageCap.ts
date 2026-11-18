import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
import { AtomicEffectType } from './core/IAtomicEffect';

/**
 * 伤害上限参数接口
 */
export interface IDamageCapParams {
  /** 持续回合数 */
  duration?: number;
  /** 最大伤害值 */
  maxDamage?: number;
}

/**
 * 伤害上限原子效果
 * 
 * 持续N回合，每回合受到的伤害不超过指定值
 * 
 * @category Special
 */
export class DamageCap extends BaseAtomicEffect {
  private duration: number;
  private maxDamage: number;

  constructor(params: IDamageCapParams) {
    super(AtomicEffectType.SPECIAL, 'DamageCap', []);
    this.duration = params.duration || 3;
    this.maxDamage = params.maxDamage || 100;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { damage } = context;

    // 在伤害计算后检查并限制最大值
    if (damage !== undefined && damage > this.maxDamage) {
      const oldDamage = damage;
      context.damage = this.maxDamage;

      return [this.createResult(
        true,
        'defender',
        'damage_cap',
        `伤害限制至${this.maxDamage}点`,
        this.maxDamage - oldDamage,
        {
          originalDamage: oldDamage,
          cappedDamage: this.maxDamage,
          reduction: oldDamage - this.maxDamage,
          duration: this.duration
        }
      )];
    }

    return [this.createResult(
      false,
      'defender',
      'damage_cap',
      '伤害未超过上限'
    )];
  }
}
