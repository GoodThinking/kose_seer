import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
import { AtomicEffectType } from './core/IAtomicEffect';

/**
 * 固定伤害减免参数接口
 */
export interface IFixedDamageReductionParams {
  /** 持续回合数 */
  duration?: number;
  /** 减免值 */
  reduction?: number;
}

/**
 * 固定伤害减免原子效果
 * 
 * 持续N回合，每回合受到的伤害减少固定值
 * 
 * @category Special
 */
export class FixedDamageReduction extends BaseAtomicEffect {
  private duration: number;
  private reduction: number;

  constructor(params: IFixedDamageReductionParams) {
    super(AtomicEffectType.SPECIAL, 'FixedDamageReduction', []);
    this.duration = params.duration || 3;
    this.reduction = params.reduction || 50;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { damage } = context;

    // 在伤害应用前减少固定值
    if (damage !== undefined && damage > 0) {
      const actualReduction = Math.min(damage, this.reduction);
      context.damage = Math.max(0, damage - actualReduction);

      return [this.createResult(
        true,
        'defender',
        'fixed_damage_reduction',
        `伤害减少${actualReduction}点`,
        -actualReduction,
        {
          originalDamage: damage,
          reducedDamage: context.damage,
          reduction: actualReduction,
          duration: this.duration
        }
      )];
    }

    return [this.createResult(
      false,
      'defender',
      'fixed_damage_reduction',
      '无伤害需要减免'
    )];
  }
}
