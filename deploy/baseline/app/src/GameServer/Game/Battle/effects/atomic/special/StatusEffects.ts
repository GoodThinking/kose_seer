import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { BattleStatus } from '../../../../../../shared/models/BattleModel';

// ============================================================
// RandomStatusEffect
// ============================================================

/**
 * 随机异常状态效果参数接口
 */
export interface IRandomStatusEffectParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'random_status';
  /** 目标 */
  target?: 'self' | 'opponent';
  /** 可选的状态列表 */
  statusList: number[];
  /** 状态持续时间 */
  duration: number;
  /** 触发概率（0-100） */
  probability?: number;
}

/**
 * 随机异常状态效果
 *
 * 功能：
 * - 从指定的状态列表中随机选择一个施加给目标
 * - 支持概率触发
 *
 * 使用场景：
 * - 效果176: 30%概率随机异常状态（中毒、麻痹、冰冻、烧伤、睡眠、混乱）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "random_status",
 *   "target": "opponent",
 *   "statusList": [1, 2, 5, 6, 8, 0],
 *   "duration": 3,
 *   "probability": 30
 * }
 * ```
 *
 * 状态ID说明：
 * - 0: 混乱
 * - 1: 中毒
 * - 2: 麻痹
 * - 5: 冰冻
 * - 6: 烧伤
 * - 8: 睡眠
 */
export class RandomStatusEffect extends BaseAtomicEffect {
  private target: 'self' | 'opponent';
  private statusList: number[];
  private duration: number;
  private probability: number;

  constructor(params: IRandomStatusEffectParams) {
    super(
      AtomicEffectType.SPECIAL,
      'RandomStatusEffect',
      [EffectTiming.AFTER_SKILL]
    );

    this.target = params.target || 'opponent';
    this.statusList = params.statusList;
    this.duration = params.duration;
    this.probability = params.probability || 100;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.target === 'self' ? this.getAttacker(context) : this.getDefender(context);

    // 概率判定
    if (Math.random() * 100 >= this.probability) {
      this.log(`随机异常状态未触发（概率${this.probability}%）`);
      return results;
    }

    // 随机选择一个状态
    const randomIndex = Math.floor(Math.random() * this.statusList.length);
    const statusId = this.statusList[randomIndex];

    // 检查是否已有异常状态
    if (target.status && target.status !== -1) {
      results.push(
        this.createResult(
          false,
          this.target === 'self' ? 'attacker' : 'defender',
          'status_failed',
          `目标已有异常状态！`,
          0
        )
      );
      this.log(`随机异常状态失败: 目标已有状态${target.status}`);
      return results;
    }

    // 检查免疫
    if (target.immuneFlags?.status) {
      results.push(
        this.createResult(
          false,
          this.target === 'self' ? 'attacker' : 'defender',
          'status_immune',
          `目标免疫异常状态！`,
          0
        )
      );
      this.log(`随机异常状态失败: 目标免疫`);
      return results;
    }

    // 施加状态
    target.status = statusId;
    if (!target.statusDurations) {
      target.statusDurations = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    }
    target.statusDurations[statusId] = this.duration;

    const statusNames: { [key: number]: string } = {
      0: '混乱',
      1: '中毒',
      2: '麻痹',
      5: '冰冻',
      6: '烧伤',
      8: '睡眠'
    };

    results.push(
      this.createResult(
        true,
        this.target === 'self' ? 'attacker' : 'defender',
        'status_inflict',
        `随机施加${statusNames[statusId] || '异常状态'}！`,
        statusId,
        { duration: this.duration }
      )
    );

    this.log(`随机异常状态: 施加状态${statusId}(${statusNames[statusId]})，持续${this.duration}回合`);

    return results;
  }

  public validate(params: any): boolean {
    if (!params.statusList || params.statusList.length === 0) {
      this.log('statusList不能为空', 'error');
      return false;
    }
    if (params.duration === undefined || params.duration < 1) {
      this.log('duration必须大于0', 'error');
      return false;
    }
    return true;
  }
}

// ============================================================
// CumulativeStatus
// ============================================================

/**
 * 累积概率异常状态参数接口
 */
export interface ICumulativeStatusParams {
  /** 基础概率 */
  baseProbability?: number;
  /** 每次增加的概率 */
  probabilityIncrease?: number;
  /** 最大概率 */
  maxProbability?: number;
  /** 状态类型 */
  status?: number;
  /** 持续回合数 */
  duration?: number;
}

/**
 * 累积概率异常状态效果
 *
 * 每次使用时概率递增，直到达到最大值
 *
 * @category Special
 */
export class CumulativeStatus extends BaseAtomicEffect {
  private baseProbability: number;
  private probabilityIncrease: number;
  private maxProbability: number;
  private status: number;
  private duration: number;

  // 追踪每个精灵的累积次数
  private cumulativeCount: Map<number, number> = new Map();

  constructor(params: ICumulativeStatusParams) {
    super(AtomicEffectType.SPECIAL, 'CumulativeStatus', []);
    this.baseProbability = params.baseProbability || 30;
    this.probabilityIncrease = params.probabilityIncrease || 10;
    this.maxProbability = params.maxProbability || 100;
    this.status = params.status || 0;
    this.duration = params.duration || 3;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;

    // 获取当前累积次数
    const count = this.cumulativeCount.get(attacker.id) || 0;

    // 计算当前概率
    const currentProbability = Math.min(
      this.baseProbability + count * this.probabilityIncrease,
      this.maxProbability
    );

    // 概率判定
    const roll = Math.random() * 100;
    const success = roll < currentProbability;

    if (success) {
      // 施加状态
      defender.status = this.status;
      if (defender.statusDurations && this.status < defender.statusDurations.length) {
        defender.statusDurations[this.status] = this.duration;
      }

      // 增加累积次数
      this.cumulativeCount.set(attacker.id, count + 1);

      return [this.createResult(
        true,
        'defender',
        'cumulative_status',
        `累积概率异常状态触发（${currentProbability.toFixed(1)}%）`,
        this.status,
        {
          status: this.status,
          duration: this.duration,
          probability: currentProbability,
          cumulativeCount: count + 1,
          success: true
        }
      )];
    } else {
      // 增加累积次数（即使失败也增加）
      this.cumulativeCount.set(attacker.id, count + 1);

      return [this.createResult(
        false,
        'defender',
        'cumulative_status',
        `累积概率异常状态未触发（${currentProbability.toFixed(1)}%）`,
        0,
        {
          probability: currentProbability,
          cumulativeCount: count + 1,
          success: false
        }
      )];
    }
  }

  /**
   * 重置累积计数（战斗结束或切换精灵时调用）
   */
  public resetCount(attackerId: number): void {
    this.cumulativeCount.delete(attackerId);
  }
}

// ============================================================
// Flammable
// ============================================================

/**
 * 易燃状态参数接口
 */
export interface IFlammableParams {
  /** 触发概率 */
  chance: number;
  /** 易燃持续回合 */
  duration: number;
}

/**
 * 易燃状态效果
 *
 * 命中后有概率令对方易燃
 * 易燃状态下受到火属性攻击伤害加倍
 *
 * @category Special
 * @example
 * // 概率易燃
 * {
 *   chance: 0.3,
 *   duration: 3
 * }
 */
export class Flammable extends BaseAtomicEffect {
  private chance: number;
  private duration: number;

  constructor(params: IFlammableParams) {
    super(AtomicEffectType.SPECIAL, 'Flammable', []);
    this.chance = params.chance;
    this.duration = params.duration;
  }

  public validate(params: any): boolean {
    return this.chance > 0 && this.chance <= 1 && this.duration > 0;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { defender } = context;

    // 概率判定
    const roll = Math.random();
    if (roll > this.chance) {
      return [this.createResult(
        false,
        'defender',
        'flammable',
        `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`
      )];
    }

    // 施加易燃状态
    defender.status = BattleStatus.FLAMMABLE;
    defender.statusTurns = this.duration;

    // 更新状态持续时间数组
    if (!defender.statusDurations) {
      defender.statusDurations = new Array(20).fill(0);
    }
    defender.statusDurations[BattleStatus.FLAMMABLE] = this.duration;

    return [this.createResult(
      true,
      'defender',
      'flammable',
      `易燃状态（${this.duration}回合）`,
      this.duration,
      {
        status: BattleStatus.FLAMMABLE,
        duration: this.duration
      }
    )];
  }
}

// ============================================================
// ConditionalStatusAura
// ============================================================

/**
 * 条件状态光环参数接口
 */
export interface IConditionalStatusAuraParams {
  /** 持续回合数 */
  duration: number;
  /** 状态类型 */
  status: BattleStatus;
  /** 状态持续回合 */
  statusDuration: number;
  /** 触发概率 */
  chance: number;
  /** 条件类型 */
  condition: 'first_strike' | 'hp_below' | 'stat_boosted';
  /** 条件参数 */
  conditionValue?: number;
}

/**
 * 条件状态光环效果
 *
 * 满足特定条件时，持续有概率施加异常状态
 *
 * @category Special
 * @example
 * // 持续先手害怕
 * {
 *   duration: 5,
 *   status: BattleStatus.FEAR,
 *   statusDuration: 2,
 *   chance: 0.5,
 *   condition: 'first_strike'
 * }
 */
export class ConditionalStatusAura extends BaseAtomicEffect {
  private duration: number;
  private status: BattleStatus;
  private statusDuration: number;
  private chance: number;
  private condition: string;
  private conditionValue?: number;

  constructor(params: IConditionalStatusAuraParams) {
    super(AtomicEffectType.SPECIAL, 'ConditionalStatusAura', []);
    this.duration = params.duration;
    this.status = params.status;
    this.statusDuration = params.statusDuration;
    this.chance = params.chance;
    this.condition = params.condition;
    this.conditionValue = params.conditionValue;
  }

  public validate(params: any): boolean {
    return this.duration > 0 && this.chance > 0 && this.chance <= 1;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;

    // 检查条件是否满足
    const conditionMet = this.checkCondition(context);

    if (!conditionMet) {
      return [this.createResult(
        false,
        'defender',
        'conditional_status_aura',
        '条件不满足'
      )];
    }

    // 概率判定
    const roll = Math.random();
    if (roll > this.chance) {
      return [this.createResult(
        false,
        'defender',
        'conditional_status_aura',
        `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`
      )];
    }

    // 施加状态
    defender.status = this.status;
    defender.statusTurns = this.statusDuration;

    // 更新状态持续时间数组
    if (!defender.statusDurations) {
      defender.statusDurations = new Array(20).fill(0);
    }
    defender.statusDurations[this.status] = this.statusDuration;

    return [this.createResult(
      true,
      'defender',
      'conditional_status_aura',
      `条件状态施加（${BattleStatus[this.status]}，${this.statusDuration}回合）`,
      this.statusDuration,
      {
        status: this.status,
        statusDuration: this.statusDuration,
        condition: this.condition,
        duration: this.duration
      }
    )];
  }

  private checkCondition(context: IEffectContext): boolean {
    const { attacker, defender } = context;

    switch (this.condition) {
      case 'first_strike':
        // 检查是否先手（速度更快）
        return attacker.speed > defender.speed;

      case 'hp_below':
        // 检查HP是否低于指定百分比
        if (this.conditionValue) {
          const hpPercent = attacker.hp / attacker.maxHp;
          return hpPercent <= this.conditionValue;
        }
        return false;

      case 'stat_boosted':
        // 检查是否有能力提升
        if (attacker.battleLevels) {
          return attacker.battleLevels.some(level => level > 0);
        }
        return false;

      default:
        return false;
    }
  }
}

// ============================================================
// OnHitConditionalStatus
// ============================================================

/**
 * 受击条件状态参数接口
 */
export interface IOnHitConditionalStatusParams {
  /** 持续回合数 */
  duration: number;
  /** 状态类型 */
  status: BattleStatus;
  /** 状态持续回合 */
  statusDuration: number;
  /** 触发概率 */
  chance: number;
  /** 伤害阈值 */
  damageThreshold: number;
}

/**
 * 受击条件状态效果
 *
 * 受到特定伤害时，有概率施加异常状态
 *
 * @category Special
 * @example
 * // 受高伤异常状态
 * {
 *   duration: 5,
 *   status: BattleStatus.BURN,
 *   statusDuration: 3,
 *   chance: 0.5,
 *   damageThreshold: 100
 * }
 */
export class OnHitConditionalStatus extends BaseAtomicEffect {
  private duration: number;
  private status: BattleStatus;
  private statusDuration: number;
  private chance: number;
  private damageThreshold: number;

  constructor(params: IOnHitConditionalStatusParams) {
    super(AtomicEffectType.SPECIAL, 'OnHitConditionalStatus', []);
    this.duration = params.duration;
    this.status = params.status;
    this.statusDuration = params.statusDuration;
    this.chance = params.chance;
    this.damageThreshold = params.damageThreshold;
  }

  public validate(params: any): boolean {
    return this.duration > 0 && this.chance > 0 && this.chance <= 1;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender, damage } = context;

    // 检查伤害是否达到阈值
    if (!damage || damage < this.damageThreshold) {
      return [this.createResult(
        false,
        'attacker',
        'on_hit_conditional_status',
        `伤害未达到阈值（${damage || 0} < ${this.damageThreshold}）`
      )];
    }

    // 概率判定
    const roll = Math.random();
    if (roll > this.chance) {
      return [this.createResult(
        false,
        'attacker',
        'on_hit_conditional_status',
        `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`
      )];
    }

    // 施加状态到攻击者
    attacker.status = this.status;
    attacker.statusTurns = this.statusDuration;

    // 更新状态持续时间数组
    if (!attacker.statusDurations) {
      attacker.statusDurations = new Array(20).fill(0);
    }
    attacker.statusDurations[this.status] = this.statusDuration;

    return [this.createResult(
      true,
      'attacker',
      'on_hit_conditional_status',
      `受击状态施加（${BattleStatus[this.status]}，${this.statusDuration}回合）`,
      this.statusDuration,
      {
        status: this.status,
        statusDuration: this.statusDuration,
        damageThreshold: this.damageThreshold,
        actualDamage: damage,
        duration: this.duration
      }
    )];
  }
}
