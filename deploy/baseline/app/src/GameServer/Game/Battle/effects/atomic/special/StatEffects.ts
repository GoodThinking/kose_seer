import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';

// ============================================================
// ContinuousStatBoost
// ============================================================

/**
 * 持续能力提升参数接口
 */
export interface IContinuousStatBoostParams {
  /** 持续回合数 */
  duration?: number;
  /** 能力索引数组 */
  stats?: number[];
  /** 每回合提升等级 */
  levelChange?: number;
  /** 目标（self/opponent） */
  target?: string;
}

/**
 * 持续能力提升状态
 */
interface IStatBoostAura {
  duration: number;
  remainingTurns: number;
  stats: number[];
  levelChange: number;
  target: string;
}

/**
 * 持续能力提升效果
 *
 * 每回合自动提升指定的多个能力
 *
 * @category Special
 */
export class ContinuousStatBoost extends BaseAtomicEffect {
  private duration: number;
  private stats: number[];
  private levelChange: number;
  private target: string;

  // 追踪每个精灵的光环状态
  private auras: Map<number, IStatBoostAura> = new Map();

  constructor(params: IContinuousStatBoostParams) {
    super(AtomicEffectType.SPECIAL, 'ContinuousStatBoost', []);
    this.duration = params.duration || 3;
    this.stats = params.stats || [0, 4]; // 默认：攻击和速度
    this.levelChange = params.levelChange || 1;
    this.target = params.target || 'self';
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;
    const targetPet = this.target === 'self' ? attacker : defender;

    // 创建光环
    this.auras.set(targetPet.id, {
      duration: this.duration,
      remainingTurns: this.duration,
      stats: this.stats,
      levelChange: this.levelChange,
      target: this.target
    });

    return [this.createResult(
      true,
      this.target === 'self' ? 'attacker' : 'defender',
      'continuous_stat_boost',
      `持续${this.duration}回合能力提升光环`,
      this.duration,
      {
        duration: this.duration,
        stats: this.stats,
        levelChange: this.levelChange,
        target: this.target
      }
    )];
  }

  /**
   * 每回合触发（在回合开始时调用）
   */
  public onTurnStart(petId: number, pet: any): IEffectResult[] {
    const aura = this.auras.get(petId);
    if (!aura) return [];

    const results: IEffectResult[] = [];

    // 提升能力
    for (const statIndex of aura.stats) {
      if (pet.statLevels && pet.statLevels[statIndex] !== undefined) {
        pet.statLevels[statIndex] += aura.levelChange;

        // 限制在[-6, 6]范围内
        pet.statLevels[statIndex] = Math.max(-6, Math.min(6, pet.statLevels[statIndex]));
      }
    }

    results.push(this.createResult(
      true,
      'attacker',
      'continuous_stat_boost_trigger',
      `持续能力提升触发`,
      aura.levelChange,
      {
        stats: aura.stats,
        levelChange: aura.levelChange,
        remainingTurns: aura.remainingTurns
      }
    ));

    // 减少剩余回合数
    aura.remainingTurns--;
    if (aura.remainingTurns <= 0) {
      this.auras.delete(petId);
    }

    return results;
  }

  /**
   * 移除光环
   */
  public removeAura(petId: number): void {
    this.auras.delete(petId);
  }

  /**
   * 检查是否有光环
   */
  public hasAura(petId: number): boolean {
    return this.auras.has(petId);
  }
}

// ============================================================
// ContinuousMultiStatBoost
// ============================================================

/**
 * 持续多能力变化参数接口
 */
export interface IContinuousMultiStatBoostParams {
  /** 持续回合数 */
  duration?: number;
  /** 能力变化配置 */
  statChanges?: Array<{
    stat: number;
    change: number;
  }>;
  /** 目标（self/opponent） */
  target?: string;
}

/**
 * 持续多能力变化状态
 */
interface IMultiStatBoostAura {
  duration: number;
  remainingTurns: number;
  statChanges: Array<{
    stat: number;
    change: number;
  }>;
  target: string;
}

/**
 * 持续多能力变化效果
 *
 * 每回合自动修改多个能力（可以是提升或下降）
 *
 * @category Special
 */
export class ContinuousMultiStatBoost extends BaseAtomicEffect {
  private duration: number;
  private statChanges: Array<{ stat: number; change: number }>;
  private target: string;

  // 追踪每个精灵的光环状态
  private auras: Map<number, IMultiStatBoostAura> = new Map();

  constructor(params: IContinuousMultiStatBoostParams) {
    super(AtomicEffectType.SPECIAL, 'ContinuousMultiStatBoost', []);
    this.duration = params.duration || 3;
    this.statChanges = params.statChanges || [
      { stat: 0, change: -1 }, // 攻击-1
      { stat: 2, change: -1 }  // 防御-1
    ];
    this.target = params.target || 'opponent';
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;
    const targetPet = this.target === 'self' ? attacker : defender;

    // 创建光环
    this.auras.set(targetPet.id, {
      duration: this.duration,
      remainingTurns: this.duration,
      statChanges: this.statChanges,
      target: this.target
    });

    return [this.createResult(
      true,
      this.target === 'self' ? 'attacker' : 'defender',
      'continuous_multi_stat_boost',
      `持续${this.duration}回合多能力变化光环`,
      this.duration,
      {
        duration: this.duration,
        statChanges: this.statChanges,
        target: this.target
      }
    )];
  }

  /**
   * 每回合触发（在回合开始时调用）
   */
  public onTurnStart(petId: number, pet: any): IEffectResult[] {
    const aura = this.auras.get(petId);
    if (!aura) return [];

    const results: IEffectResult[] = [];

    // 修改能力
    for (const { stat, change } of aura.statChanges) {
      if (pet.statLevels && pet.statLevels[stat] !== undefined) {
        pet.statLevels[stat] += change;

        // 限制在[-6, 6]范围内
        pet.statLevels[stat] = Math.max(-6, Math.min(6, pet.statLevels[stat]));
      }
    }

    results.push(this.createResult(
      true,
      'attacker',
      'continuous_multi_stat_boost_trigger',
      `持续多能力变化触发`,
      aura.statChanges.length,
      {
        statChanges: aura.statChanges,
        remainingTurns: aura.remainingTurns
      }
    ));

    // 减少剩余回合数
    aura.remainingTurns--;
    if (aura.remainingTurns <= 0) {
      this.auras.delete(petId);
    }

    return results;
  }

  /**
   * 移除光环
   */
  public removeAura(petId: number): void {
    this.auras.delete(petId);
  }

  /**
   * 检查是否有光环
   */
  public hasAura(petId: number): boolean {
    return this.auras.has(petId);
  }
}

// ============================================================
// ContinuousStatChange
// ============================================================

/**
 * 持续每回合改变能力效果参数接口
 */
export interface IContinuousStatChangeParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'continuous_stat_change';
  /** 持续回合数 */
  duration: number;
  /** 能力变化列表 */
  statChanges: Array<{
    stat: number;      // 能力索引 (0-5)
    change: number;    // 变化值
  }>;
  /** 触发时机 */
  timing?: 'TURN_START' | 'TURN_END';
  /** 目标 */
  target?: 'self' | 'opponent';
}

/**
 * 持续每回合改变能力效果
 *
 * 功能：
 * - X回合内，每回合改变目标的指定能力
 * - 支持多个能力同时变化
 * - 可选择在回合开始或结束时触发
 *
 * 使用场景：
 * - 效果150: 3回合内，对手每回合防御和特防等级-1
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "continuous_stat_change",
 *   "target": "opponent",
 *   "duration": 3,
 *   "statChanges": [
 *     { "stat": 1, "change": -1 },
 *     { "stat": 3, "change": -1 }
 *   ],
 *   "timing": "TURN_START"
 * }
 * ```
 */
export class ContinuousStatChange extends BaseAtomicEffect {
  private duration: number;
  private statChanges: Array<{ stat: number; change: number }>;
  private timing: 'TURN_START' | 'TURN_END';
  private target: 'self' | 'opponent';

  constructor(params: IContinuousStatChangeParams) {
    super(
      AtomicEffectType.SPECIAL,
      'ContinuousStatChange',
      [EffectTiming.AFTER_SKILL, EffectTiming.TURN_START, EffectTiming.TURN_END]
    );

    this.duration = params.duration;
    this.statChanges = params.statChanges;
    this.timing = params.timing || 'TURN_START';
    this.target = params.target || 'opponent';
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.target === 'self' ? this.getAttacker(context) : this.getDefender(context);

    // 在AFTER_SKILL时机设置效果
    if (context.timing === EffectTiming.AFTER_SKILL) {
      if (!target.effectCounters) {
        target.effectCounters = {};
      }

      // 存储持续效果信息（使用特殊命名的计数器）
      target.effectCounters['continuous_stat_change'] = this.duration;
      // 将每个能力变化存储为独立的计数器
      for (let i = 0; i < this.statChanges.length; i++) {
        const change = this.statChanges[i];
        target.effectCounters[`continuous_stat_${i}_stat`] = change.stat;
        target.effectCounters[`continuous_stat_${i}_change`] = change.change;
      }
      target.effectCounters['continuous_stat_count'] = this.statChanges.length;
      target.effectCounters['continuous_stat_timing'] = this.timing === 'TURN_START' ? 1 : 2;

      results.push(
        this.createResult(
          true,
          this.target === 'self' ? 'attacker' : 'defender',
          'continuous_stat_change',
          `持续能力变化状态！持续${this.duration}回合`,
          this.duration,
          { statChanges: this.statChanges }
        )
      );

      this.log(`持续能力变化: ${this.statChanges.length}个能力, 持续${this.duration}回合`);
    }

    // 在指定时机触发能力变化
    const shouldTrigger =
      (this.timing === 'TURN_START' && context.timing === EffectTiming.TURN_START) ||
      (this.timing === 'TURN_END' && context.timing === EffectTiming.TURN_END);

    if (shouldTrigger && target.effectCounters?.['continuous_stat_change']) {
      const count = target.effectCounters['continuous_stat_count'] || 0;
      if (count > 0) {
        // 重建能力变化列表
        const statChanges: Array<{ stat: number; change: number }> = [];
        for (let i = 0; i < count; i++) {
          const stat = target.effectCounters[`continuous_stat_${i}_stat`] || 0;
          const change = target.effectCounters[`continuous_stat_${i}_change`] || 0;
          statChanges.push({ stat, change });
        }

        // 初始化battleLv
        if (!target.battleLv) {
          target.battleLv = [0, 0, 0, 0, 0, 0];
        }

        // 应用能力变化
        for (const change of statChanges) {
          const oldLevel = target.battleLv[change.stat];
          target.battleLv[change.stat] = Math.max(-6, Math.min(6, oldLevel + change.change));

          results.push(
            this.createResult(
              true,
              this.target === 'self' ? 'attacker' : 'defender',
              'stat_change',
              `能力${change.stat}变化${change.change > 0 ? '+' : ''}${change.change}！`,
              change.change,
              { statIndex: change.stat, oldLevel, newLevel: target.battleLv[change.stat] }
            )
          );

          this.log(`持续能力变化触发: 能力${change.stat} ${oldLevel} -> ${target.battleLv[change.stat]}`);
        }

        // 递减计数器
        target.effectCounters['continuous_stat_change']--;
        if (target.effectCounters['continuous_stat_change'] <= 0) {
          delete target.effectCounters['continuous_stat_change'];
          const count = target.effectCounters['continuous_stat_count'] || 0;
          for (let i = 0; i < count; i++) {
            delete target.effectCounters[`continuous_stat_${i}_stat`];
            delete target.effectCounters[`continuous_stat_${i}_change`];
          }
          delete target.effectCounters['continuous_stat_count'];
          delete target.effectCounters['continuous_stat_timing'];

          results.push(
            this.createResult(
              true,
              this.target === 'self' ? 'attacker' : 'defender',
              'continuous_stat_change_end',
              `持续能力变化状态解除！`,
              0
            )
          );

          this.log(`持续能力变化状态解除`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.duration === undefined || params.duration < 1) {
      this.log('duration必须大于0', 'error');
      return false;
    }
    if (!params.statChanges || params.statChanges.length === 0) {
      this.log('statChanges不能为空', 'error');
      return false;
    }
    return true;
  }
}

// ============================================================
// CumulativeCritBoost
// ============================================================

/**
 * 累积暴击率提升参数接口
 */
export interface ICumulativeCritBoostParams {
  /** 每次增加的暴击率 */
  critIncrease?: number;
  /** 最大暴击率增加 */
  maxCritIncrease?: number;
}

/**
 * 累积暴击率提升效果
 *
 * 每次攻击后暴击率递增，直到达到最大值
 *
 * @category Special
 */
export class CumulativeCritBoost extends BaseAtomicEffect {
  private critIncrease: number;
  private maxCritIncrease: number;

  // 追踪每个精灵的累积暴击率
  private cumulativeCrit: Map<number, number> = new Map();

  constructor(params: ICumulativeCritBoostParams) {
    super(AtomicEffectType.SPECIAL, 'CumulativeCritBoost', []);
    this.critIncrease = params.critIncrease || 6.25;
    this.maxCritIncrease = params.maxCritIncrease || 50;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker } = context;

    // 获取当前累积暴击率
    const currentCrit = this.cumulativeCrit.get(attacker.id) || 0;

    // 计算新的暴击率
    const newCrit = Math.min(
      currentCrit + this.critIncrease,
      this.maxCritIncrease
    );

    // 更新累积暴击率
    this.cumulativeCrit.set(attacker.id, newCrit);

    // 应用暴击率提升
    if (context.critRate !== undefined) {
      context.critRate += newCrit;
    }

    return [this.createResult(
      true,
      'attacker',
      'cumulative_crit_boost',
      `累积暴击率提升 +${newCrit.toFixed(2)}%`,
      newCrit,
      {
        critIncrease: this.critIncrease,
        currentCrit: newCrit,
        maxCrit: this.maxCritIncrease,
        isMaxed: newCrit >= this.maxCritIncrease
      }
    )];
  }

  /**
   * 重置累积暴击率（战斗结束或切换精灵时调用）
   */
  public resetCrit(attackerId: number): void {
    this.cumulativeCrit.delete(attackerId);
  }

  /**
   * 获取当前累积暴击率
   */
  public getCurrentCrit(attackerId: number): number {
    return this.cumulativeCrit.get(attackerId) || 0;
  }
}

// ============================================================
// StatBoostNullify
// ============================================================

/**
 * 能力增强失效效果参数接口
 */
export interface IStatBoostNullifyParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'stat_boost_nullify';
  /** 持续回合数 */
  duration: number;
  /** 目标 */
  target?: 'self' | 'opponent';
}

/**
 * 能力增强失效效果
 *
 * 功能：
 * - X回合内，使得对手所有能力增强效果失效
 * - 能力提升等级被视为0
 * - 不影响能力下降
 *
 * 使用场景：
 * - 效果156: 3回合内，使得对手所有能力增强效果失效
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "stat_boost_nullify",
 *   "target": "opponent",
 *   "duration": 3
 * }
 * ```
 */
export class StatBoostNullify extends BaseAtomicEffect {
  private duration: number;
  private target: 'self' | 'opponent';

  constructor(params: IStatBoostNullifyParams) {
    super(
      AtomicEffectType.SPECIAL,
      'StatBoostNullify',
      [EffectTiming.AFTER_SKILL, EffectTiming.TURN_END]
    );

    this.duration = params.duration;
    this.target = params.target || 'opponent';
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.target === 'self' ? this.getAttacker(context) : this.getDefender(context);

    // 在AFTER_SKILL时机设置效果
    if (context.timing === EffectTiming.AFTER_SKILL) {
      if (!target.effectCounters) {
        target.effectCounters = {};
      }

      target.effectCounters['stat_boost_nullify'] = this.duration;

      results.push(
        this.createResult(
          true,
          this.target === 'self' ? 'attacker' : 'defender',
          'stat_boost_nullify',
          `能力增强失效状态！持续${this.duration}回合`,
          this.duration
        )
      );

      this.log(`能力增强失效: 持续${this.duration}回合`);
    }

    // 在TURN_END时机递减计数器
    if (context.timing === EffectTiming.TURN_END) {
      if (target.effectCounters?.['stat_boost_nullify']) {
        target.effectCounters['stat_boost_nullify']--;
        if (target.effectCounters['stat_boost_nullify'] <= 0) {
          delete target.effectCounters['stat_boost_nullify'];
          results.push(
            this.createResult(
              true,
              this.target === 'self' ? 'attacker' : 'defender',
              'stat_boost_nullify_end',
              `能力增强失效状态解除！`,
              0
            )
          );
          this.log(`能力增强失效状态解除`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.duration === undefined || params.duration < 1) {
      this.log('duration必须大于0', 'error');
      return false;
    }
    return true;
  }
}

// ============================================================
// StatBoostReversal
// ============================================================

/**
 * 能力提升反转参数接口
 */
export interface IStatBoostReversalParams {
  /** 目标（self/opponent） */
  target?: string;
}

/**
 * 能力提升反转效果
 *
 * 将目标的所有能力提升变为能力下降
 *
 * @category Special
 */
export class StatBoostReversal extends BaseAtomicEffect {
  private target: string;

  constructor(params: IStatBoostReversalParams) {
    super(AtomicEffectType.SPECIAL, 'StatBoostReversal', []);
    this.target = params.target || 'opponent';
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;
    const targetPet = this.target === 'self' ? attacker : defender;

    let reversedCount = 0;

    // 反转所有能力提升
    if (targetPet.battleLevels) {
      for (let i = 0; i < targetPet.battleLevels.length; i++) {
        if (targetPet.battleLevels[i] > 0) {
          targetPet.battleLevels[i] = -targetPet.battleLevels[i];
          reversedCount++;
        }
      }
    }

    return [this.createResult(
      reversedCount > 0,
      this.target === 'self' ? 'attacker' : 'defender',
      'stat_boost_reversal',
      `能力提升反转（${reversedCount}个能力）`,
      reversedCount,
      {
        target: this.target,
        reversedCount
      }
    )];
  }
}

// ============================================================
// IgnoreDefenseBuff
// ============================================================

/**
 * 无视防御能力提升参数接口
 */
export interface IIgnoreDefenseBuffParams {
  /** 是否无视特防 */
  ignoreSpDefense?: boolean;
}

/**
 * 无视防御能力提升效果
 *
 * 伤害计算时忽略对手的防御/特防能力提升
 *
 * @category Special
 */
export class IgnoreDefenseBuff extends BaseAtomicEffect {
  private ignoreSpDefense: boolean;

  constructor(params: IIgnoreDefenseBuffParams) {
    super(AtomicEffectType.SPECIAL, 'IgnoreDefenseBuff', []);
    this.ignoreSpDefense = params.ignoreSpDefense !== false;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { defender } = context;

    // 简化实现：标记忽略防御buff
    // 实际的忽略逻辑需要在伤害计算中实现
    let ignoredStats: number[] = [];

    // 检查防御能力提升
    if (defender.battleLevels) {
      // 物理防御（index 1）
      if (defender.battleLevels[1] > 0) {
        ignoredStats.push(1);
      }
      // 特殊防御（index 3）
      if (this.ignoreSpDefense && defender.battleLevels[3] > 0) {
        ignoredStats.push(3);
      }
    }

    return [this.createResult(
      ignoredStats.length > 0,
      'attacker',
      'ignore_defense_buff',
      `无视防御能力提升`,
      ignoredStats.length,
      {
        ignoredStats,
        ignoreSpDefense: this.ignoreSpDefense
      }
    )];
  }
}
