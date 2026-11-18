import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
import { AtomicEffectType } from './core/IAtomicEffect';

/**
 * 伤害下限参数接口
 */
export interface IDamageFloorParams {
  /** 最小伤害值 */
  minDamage?: number;
}

/**
 * 伤害下限原子效果
 * 
 * 确保造成的伤害不低于指定值
 * 
 * @category Special
 */
export class DamageFloor extends BaseAtomicEffect {
  private minDamage: number;

  constructor(params: IDamageFloorParams) {
    super(AtomicEffectType.SPECIAL, 'DamageFloor', []);
    this.minDamage = params.minDamage || 1;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { damage } = context;

    // 只在伤害计算后应用
    if (damage !== undefined && damage > 0 && damage < this.minDamage) {
      const oldDamage = damage;
      context.damage = this.minDamage;

      return [this.createResult(
        true,
        'attacker',
        'damage_floor',
        `伤害提升至最小值${this.minDamage}`,
        this.minDamage - oldDamage,
        {
          oldDamage,
          newDamage: this.minDamage,
          increase: this.minDamage - oldDamage
        }
      )];
    }

    return [this.createResult(
      false,
      'attacker',
      'damage_floor',
      '伤害正常'
    )];
  }
}
