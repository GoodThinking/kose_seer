import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IHealParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

/**
 * 回复效果原子效果
 * 回复目标的HP
 *
 * @example
 * // 回复自身最大HP的50%
 * { type: 'heal', target: 'self', mode: 'percent', value: 0.5 }
 *
 * // 回复固定100点HP
 * { type: 'heal', target: 'self', mode: 'fixed', value: 100 }
 *
 * // 回复造成伤害的50%
 * { type: 'heal', target: 'self', mode: 'damage_percent', value: 0.5 }
 */
export class HealEffect extends BaseAtomicEffect {
  private params: IHealParams;

  constructor(params: IHealParams) {
    super(AtomicEffectType.HEAL, 'Heal Effect', [EffectTiming.AFTER_SKILL, EffectTiming.AFTER_DAMAGE_APPLY]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.getTarget(context, this.params.target);
    if (!target) return results;

    let healAmount = 0;
    if (this.params.mode === 'percent') {
      healAmount = Math.floor(target.maxHp * this.params.value);
    } else if (this.params.mode === 'fixed') {
      healAmount = this.params.value;
    } else if (this.params.mode === 'damage_percent' && context.damage) {
      healAmount = Math.floor(context.damage * this.params.value);
    }

    const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
    if (actualHeal > 0) {
      target.hp += actualHeal;
      results.push(this.createResult(
        true,
        this.params.target === 'self' ? 'attacker' : 'defender',
        'heal',
        `回复${actualHeal}HP`,
        actualHeal
      ));
    }
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.HEAL &&
           ['self', 'opponent'].includes(params.target) &&
           ['percent', 'fixed', 'damage_percent'].includes(params.mode) &&
           typeof params.value === 'number';
  }
}

/**
 * 回复反转效果参数接口
 */
export interface IHealReversalParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'heal_reversal';
  /** 持续回合数（可选，默认永久） */
  duration?: number;
  /** 是否同时反转吸血效果（可选，默认true） */
  reverseDrain?: boolean;
}

/**
 * 回复反转效果
 *
 * 功能：
 * - 将回复效果转换为伤害
 * - 可设置持续回合数或永久生效
 * - 可选择是否反转吸血效果
 *
 * 使用场景：
 * - 治疗封印（回复变成伤害）
 * - 诅咒状态（无法回复HP）
 * - 反转领域（所有回复效果反转）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "heal_reversal",
 *   "duration": 5,
 *   "reverseDrain": true
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   remainingTurns?: number;    // 剩余回合数
 *   isActive: boolean;          // 是否激活
 *   reverseDrain: boolean;      // 是否反转吸血
 * }
 * ```
 */
export class HealReversal extends BaseAtomicEffect {
  private duration?: number;
  private reverseDrain: boolean;

  constructor(params: IHealReversalParams) {
    super(
      AtomicEffectType.SPECIAL,
      'HealReversal',
      [EffectTiming.AFTER_SKILL, EffectTiming.ON_HP_CHANGE, EffectTiming.TURN_END]
    );

    this.duration = params.duration;
    this.reverseDrain = params.reverseDrain ?? true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    // 在AFTER_SKILL时机激活反转
    if (context.timing === EffectTiming.AFTER_SKILL) {
      const reversalState = this.getReversalState(defender);
      reversalState.isActive = true;
      reversalState.reverseDrain = this.reverseDrain;
      if (this.duration !== undefined) {
        reversalState.remainingTurns = this.duration;
      }

      results.push(
        this.createResult(
          true,
          'defender',
          'heal_reversal_activate',
          `回复反转激活！回复将变成伤害`,
          0,
          { duration: this.duration }
        )
      );

      this.log(`回复反转激活: 持续${this.duration ?? '永久'}回合`);
    }

    // 在ON_HP_CHANGE时机拦截回复
    if (context.timing === EffectTiming.ON_HP_CHANGE) {
      const reversalState = this.getReversalState(defender);

      if (reversalState.isActive) {
        // 这里需要在实际的HP变化逻辑中实现反转
        // 此处仅作为标记，实际反转逻辑需要在HP变化处理中检查此状态
        results.push(
          this.createResult(
            true,
            'defender',
            'heal_reversal_check',
            `回复反转生效中`,
            0
          )
        );
      }
    }

    // 在TURN_END时机检查持续时间
    if (context.timing === EffectTiming.TURN_END) {
      const reversalState = this.getReversalState(defender);

      if (reversalState.isActive && reversalState.remainingTurns !== undefined) {
        reversalState.remainingTurns--;
        if (reversalState.remainingTurns <= 0) {
          // 反转结束
          reversalState.isActive = false;

          results.push(
            this.createResult(
              true,
              'defender',
              'heal_reversal_end',
              `回复反转结束了！`,
              0
            )
          );

          this.log(`回复反转结束`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.duration !== undefined && params.duration < 1) {
      this.log('duration必须至少为1', 'error');
      return false;
    }
    return true;
  }

  /**
   * 获取反转状态
   */
  private getReversalState(pet: any): {
    remainingTurns?: number;
    isActive: boolean;
    reverseDrain: boolean;
  } {
    if (!pet.effectStates) {
      pet.effectStates = {};
    }
    if (!pet.effectStates.healReversal) {
      pet.effectStates.healReversal = {
        isActive: false,
        reverseDrain: true
      };
    }
    return pet.effectStates.healReversal;
  }
}

/**
 * 持续回复参数接口
 */
export interface IRegenerationParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'regeneration';
  target: 'self' | 'opponent';
  duration: number;
  healRatio?: number;
  healAmount?: number;
}

/**
 * 持续回复原子效果
 * 每回合回复一定比例或固定值的HP
 *
 * @example
 * // 每回合回复最大HP的1/16，持续5回合
 * { type: 'special', specialType: 'regeneration', target: 'self', duration: 5, healRatio: 0.0625 }
 *
 * // 每回合回复50HP，持续3回合
 * { type: 'special', specialType: 'regeneration', target: 'self', duration: 3, healAmount: 50 }
 */
export class Regeneration extends BaseAtomicEffect {
  private params: IRegenerationParams;

  constructor(params: IRegenerationParams) {
    super(AtomicEffectType.SPECIAL, 'Regeneration', [EffectTiming.TURN_END]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.getTarget(context, this.params.target);
    if (!target) return results;

    let healAmount = 0;
    if (this.params.healRatio !== undefined) {
      healAmount = Math.floor(target.maxHp * this.params.healRatio);
    } else if (this.params.healAmount !== undefined) {
      healAmount = this.params.healAmount;
    } else {
      healAmount = Math.floor(target.maxHp / 16);
    }

    healAmount = Math.max(1, healAmount);
    const actualHeal = Math.min(healAmount, target.maxHp - target.hp);

    if (actualHeal > 0) {
      target.hp += actualHeal;
      results.push(this.createResult(
        true,
        this.params.target === 'self' ? 'attacker' : 'defender',
        'regeneration',
        `回复了${actualHeal}点HP`,
        actualHeal
      ));
    }
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'regeneration' &&
           ['self', 'opponent'].includes(params.target) &&
           typeof params.duration === 'number' && params.duration >= 1;
  }
}
