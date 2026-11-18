import { BaseAtomicEffect } from './core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../core/EffectContext';
import { AtomicEffectType } from './core/IAtomicEffect';

/**
 * 击败回复参数接口
 */
export interface IKoHealParams {
  /** 回复比例（相对于最大HP） */
  healRatio?: number;
}

/**
 * 击败回复原子效果
 * 
 * 击败对手后回复自身HP
 * 
 * @category Special
 */
export class KoHeal extends BaseAtomicEffect {
  private healRatio: number;

  constructor(params: IKoHealParams) {
    super(AtomicEffectType.SPECIAL, 'KoHeal', []);
    this.healRatio = params.healRatio || 0.25;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender, damage } = context;

    // 检查是否击败对手
    const defenderHp = defender.hp;
    const willKo = damage !== undefined && damage >= defenderHp;

    if (willKo) {
      const maxHp = attacker.maxHp;
      const healAmount = Math.floor(maxHp * this.healRatio);
      const actualHeal = Math.min(healAmount, maxHp - attacker.hp);

      if (actualHeal > 0) {
        return [this.createResult(
          true,
          'attacker',
          'ko_heal',
          `击败对手回复${actualHeal}点HP`,
          actualHeal,
          {
            healRatio: this.healRatio,
            healAmount,
            actualHeal,
            koTarget: defender.name
          }
        )];
      }
    }

    return [this.createResult(
      false,
      'attacker',
      'ko_heal',
      '未击败对手'
    )];
  }
}
