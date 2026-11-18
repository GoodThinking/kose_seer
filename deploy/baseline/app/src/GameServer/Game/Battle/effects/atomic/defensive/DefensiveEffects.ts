import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

// ============================================================
// Counter
// ============================================================

/**
 * 反击效果参数接口
 */
export interface ICounterParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'counter';
  reflectRatio: number;         // 反弹比例（0-1）
  reflectFixed?: number;        // 固定反弹值（优先于比例）
  duration: number;             // 持续回合数
  minTurns?: number;            // 最小持续回合（随机范围）
  maxTurns?: number;            // 最大持续回合（随机范围）
  counterType?: 'all' | 'physical' | 'special'; // 反击类型
}

/**
 * 反击原子效果
 * 在X~Y回合内，将自身受到的伤害按比例反弹给对方
 *
 * 用途：
 * - Effect_21: 持续反弹伤害（3-5回合，反弹50%）
 * - Effect_462: 固定值反弹
 *
 * 特性：
 * - 支持比例反弹和固定值反弹
 * - 支持随机持续回合数
 * - 可以指定反击类型（物理/特殊/全部）
 *
 * @example
 * // 3-5回合内反弹50%伤害
 * {
 *   type: 'special',
 *   specialType: 'counter',
 *   reflectRatio: 0.5,
 *   duration: 0,
 *   minTurns: 3,
 *   maxTurns: 5,
 *   counterType: 'all'
 * }
 *
 * @example
 * // 固定反弹100点伤害，持续3回合
 * {
 *   type: 'special',
 *   specialType: 'counter',
 *   reflectFixed: 100,
 *   duration: 3,
 *   counterType: 'physical'
 * }
 *
 * @category Defensive
 */
export class Counter extends BaseAtomicEffect {
  private params: ICounterParams;

  constructor(params: ICounterParams) {
    super(AtomicEffectType.SPECIAL, 'Counter', [EffectTiming.AFTER_DAMAGE_APPLY]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = context.attacker;
    const defender = context.defender;
    const damage = context.damage;

    // 检查是否有伤害
    if (damage <= 0) {
      return results;
    }

    // 检查反击类型
    if (this.params.counterType) {
      const skillCategory = context.skillCategory;
      if (this.params.counterType === 'physical' && skillCategory !== 1) {
        return results;
      }
      if (this.params.counterType === 'special' && skillCategory !== 2) {
        return results;
      }
    }

    // 计算反弹伤害
    let counterDamage = 0;
    if (this.params.reflectFixed !== undefined) {
      // 固定值反弹
      counterDamage = this.params.reflectFixed;
    } else {
      // 比例反弹
      counterDamage = Math.floor(damage * this.params.reflectRatio);
    }

    // 确保反弹伤害至少为1
    counterDamage = Math.max(1, counterDamage);

    // 对攻击者造成反弹伤害
    const actualCounterDamage = Math.min(counterDamage, attacker.hp);
    if (actualCounterDamage > 0) {
      attacker.hp -= actualCounterDamage;

      results.push(this.createResult(
        true,
        'attacker',
        'counter_damage',
        `受到${actualCounterDamage}点反击伤害`,
        actualCounterDamage,
        { originalDamage: damage, counterDamage: actualCounterDamage }
      ));

      this.log(`反击: 受到${damage}伤害, 反弹${actualCounterDamage}伤害`);
    }

    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.SPECIAL || params.specialType !== 'counter') {
      return false;
    }

    // 必须有reflectRatio或reflectFixed之一
    const hasRatio = typeof params.reflectRatio === 'number';
    const hasFixed = typeof params.reflectFixed === 'number';

    if (!hasRatio && !hasFixed) {
      return false;
    }

    // 如果有随机范围，检查范围有效性
    if (params.minTurns !== undefined && params.maxTurns !== undefined) {
      if (params.minTurns > params.maxTurns || params.minTurns < 1) {
        return false;
      }
    } else if (typeof params.duration !== 'number' || params.duration < 1) {
      return false;
    }

    return true;
  }

  /**
   * 获取实际持续回合数
   */
  public getDuration(): number {
    if (this.params.minTurns !== undefined && this.params.maxTurns !== undefined) {
      const range = this.params.maxTurns - this.params.minTurns + 1;
      return this.params.minTurns + Math.floor(Math.random() * range);
    }
    return this.params.duration;
  }
}

// ============================================================
// DamageShield
// ============================================================

/**
 * 伤害护盾参数接口
 */
export interface IDamageShieldParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'damage_shield';
  reductionRatio?: number;      // 伤害减免比例（0-1）
  reductionFixed?: number;      // 固定减免值
  duration: number;             // 持续回合数
  shieldType?: 'all' | 'physical' | 'special'; // 护盾类型
  maxReduction?: number;        // 最大减免值
}

/**
 * 伤害护盾原子效果
 * 在X回合内减少特定类型的伤害
 *
 * 用途：
 * - Effect_50: 持续物理伤害减免（5回合，减免50%）
 * - Effect_54: 持续降低对方伤害
 * - Effect_125: 伤害上限
 *
 * 特性：
 * - 支持比例减免和固定值减免
 * - 可以指定护盾类型（物理/特殊/全部）
 * - 可以设置最大减免值
 *
 * @example
 * // 5回合内物理伤害减免50%
 * {
 *   type: 'special',
 *   specialType: 'damage_shield',
 *   reductionRatio: 0.5,
 *   duration: 5,
 *   shieldType: 'physical'
 * }
 *
 * @example
 * // 3回合内每次受到的伤害不超过100
 * {
 *   type: 'special',
 *   specialType: 'damage_shield',
 *   duration: 3,
 *   maxReduction: 100,
 *   shieldType: 'all'
 * }
 *
 * @category Defensive
 */
export class DamageShield extends BaseAtomicEffect {
  private params: IDamageShieldParams;

  constructor(params: IDamageShieldParams) {
    super(AtomicEffectType.SPECIAL, 'Damage Shield', [EffectTiming.BEFORE_DAMAGE_APPLY]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const originalDamage = context.damage;

    // 检查伤害是否为0
    if (originalDamage <= 0) {
      return results;
    }

    // 检查护盾类型
    if (this.params.shieldType) {
      const skillCategory = context.skillCategory;
      if (this.params.shieldType === 'physical' && skillCategory !== 1) {
        return results;
      }
      if (this.params.shieldType === 'special' && skillCategory !== 2) {
        return results;
      }
    }

    let newDamage = originalDamage;
    let reductionAmount = 0;

    // 计算减免
    if (this.params.reductionFixed !== undefined) {
      // 固定值减免
      reductionAmount = this.params.reductionFixed;
      newDamage = Math.max(1, originalDamage - reductionAmount);
    } else if (this.params.reductionRatio !== undefined) {
      // 比例减免
      reductionAmount = Math.floor(originalDamage * this.params.reductionRatio);
      newDamage = Math.max(1, originalDamage - reductionAmount);
    }

    // 应用最大减免限制
    if (this.params.maxReduction !== undefined) {
      if (originalDamage > this.params.maxReduction) {
        newDamage = this.params.maxReduction;
        reductionAmount = originalDamage - newDamage;
      }
    }

    // 更新伤害值
    if (newDamage !== originalDamage) {
      context.damage = newDamage;

      const shieldTypeName = this.getShieldTypeName(this.params.shieldType);

      results.push(this.createResult(
        true,
        'defender',
        'damage_shield',
        `${shieldTypeName}护盾减免${reductionAmount}点伤害`,
        reductionAmount,
        { originalDamage, newDamage, reductionAmount }
      ));

      this.log(`伤害护盾: ${originalDamage} -> ${newDamage} (减免${reductionAmount})`);
    }

    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.SPECIAL || params.specialType !== 'damage_shield') {
      return false;
    }

    if (typeof params.duration !== 'number' || params.duration < 1) {
      return false;
    }

    // 必须有reductionRatio、reductionFixed或maxReduction之一
    const hasRatio = typeof params.reductionRatio === 'number';
    const hasFixed = typeof params.reductionFixed === 'number';
    const hasMax = typeof params.maxReduction === 'number';

    return hasRatio || hasFixed || hasMax;
  }

  /**
   * 获取护盾类型名称
   */
  private getShieldTypeName(type?: string): string {
    switch (type) {
      case 'physical': return '物理';
      case 'special': return '特殊';
      case 'all':
      default: return '全';
    }
  }
}

// ============================================================
// Endure
// ============================================================

/**
 * 忍耐效果参数接口
 */
export interface IEndureParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'endure';
  duration: number;             // 持续回合数
  minHp?: number;               // 保留的最小HP（默认1）
  probability?: number;         // 触发概率（0-100，默认100）
  oncePerBattle?: boolean;      // 是否每场战斗只触发一次
}

/**
 * 忍耐原子效果
 * 在X回合内，受到致死攻击时保留1点HP
 *
 * 用途：
 * - Effect_68: 保留1血（3回合内必定触发一次）
 *
 * 特性：
 * - 防止被一击秒杀
 * - 可以设置保留的最小HP
 * - 可以设置触发概率
 * - 可以限制每场战斗只触发一次
 *
 * @example
 * // 3回合内受到致死攻击时保留1HP
 * {
 *   type: 'special',
 *   specialType: 'endure',
 *   duration: 3,
 *   minHp: 1,
 *   oncePerBattle: true
 * }
 *
 * @example
 * // 5回合内50%概率保留5HP
 * {
 *   type: 'special',
 *   specialType: 'endure',
 *   duration: 5,
 *   minHp: 5,
 *   probability: 50
 * }
 *
 * @category Defensive
 */
export class Endure extends BaseAtomicEffect {
  private params: IEndureParams;
  private static triggeredInBattle: Set<number> = new Set();

  constructor(params: IEndureParams) {
    super(AtomicEffectType.SPECIAL, 'Endure', [EffectTiming.BEFORE_DAMAGE_APPLY]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = context.defender;
    const damage = context.damage;

    // 检查是否会被击败
    const wouldBeFatal = defender.hp - damage <= 0;
    if (!wouldBeFatal) {
      return results;
    }

    // 检查是否已经在本场战斗中触发过
    if (this.params.oncePerBattle && Endure.triggeredInBattle.has(defender.id)) {
      results.push(this.createResult(
        false,
        'defender',
        'endure_used',
        '忍耐效果已在本场战斗中使用过',
        0
      ));
      return results;
    }

    // 检查概率
    const probability = this.params.probability || 100;
    if (!this.checkProbability(probability)) {
      results.push(this.createResult(
        false,
        'defender',
        'endure_failed',
        `忍耐效果触发失败（概率${probability}%）`,
        0
      ));
      return results;
    }

    // 触发忍耐效果
    const minHp = this.params.minHp || 1;
    const newDamage = defender.hp - minHp;

    // 修改伤害值，确保保留最小HP
    context.damage = Math.max(0, newDamage);

    // 标记已触发
    if (this.params.oncePerBattle) {
      Endure.triggeredInBattle.add(defender.id);
    }

    results.push(this.createResult(
      true,
      'defender',
      'endure',
      `忍耐效果触发，保留${minHp}点HP`,
      minHp,
      { originalDamage: damage, newDamage: context.damage, minHp }
    ));

    this.log(`忍耐效果触发: 原伤害${damage}, 修正后${context.damage}, 保留${minHp}HP`);

    return results;
  }

  public validate(params: any): boolean {
    return params &&
           params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'endure' &&
           typeof params.duration === 'number' &&
           params.duration > 0;
  }

  /**
   * 重置战斗触发记录（新战斗开始时调用）
   */
  public static ResetBattleTriggers(): void {
    Endure.triggeredInBattle.clear();
  }

  /**
   * 检查精灵是否已触发过忍耐
   */
  public static HasTriggered(petId: number): boolean {
    return Endure.triggeredInBattle.has(petId);
  }
}

// ============================================================
// ImmuneEffect
// ============================================================

export interface IImmuneParams {
  type: AtomicEffectType.IMMUNE;
  target: 'self' | 'opponent';
  immuneType: 'damage' | 'status' | 'stat_change';
}

/**
 * 免疫效果原子效果
 * 使目标免疫特定类型的效果
 */
export class ImmuneEffect extends BaseAtomicEffect {
  private params: IImmuneParams;

  constructor(params: IImmuneParams) {
    super(AtomicEffectType.IMMUNE, 'Immune Effect', [EffectTiming.BEFORE_DAMAGE_APPLY]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.getTarget(context, this.params.target);
    if (!target) return results;

    if (this.params.immuneType === 'damage' && context.damage) {
      context.damage = 0;
      results.push(this.createResult(true, this.params.target === 'self' ? 'attacker' : 'defender', 'immune', '免疫伤害', 0));
    }
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.IMMUNE &&
           ['self', 'opponent'].includes(params.target) &&
           ['damage', 'status', 'stat_change'].includes(params.immuneType);
  }
}

// ============================================================
// ReflectEffect
// ============================================================

export interface IReflectParams {
  type: AtomicEffectType.REFLECT;
  reflectRatio: number;
}

/**
 * 反弹效果原子效果
 * 将受到的伤害按比例反弹给攻击者
 */
export class ReflectEffect extends BaseAtomicEffect {
  private params: IReflectParams;

  constructor(params: IReflectParams) {
    super(AtomicEffectType.REFLECT, 'Reflect Effect', [EffectTiming.AFTER_DAMAGE_APPLY]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    if (!context.damage || context.damage <= 0) return results;

    const reflectDamage = Math.floor(context.damage * this.params.reflectRatio);
    if (reflectDamage > 0 && context.attacker) {
      context.attacker.hp = Math.max(0, context.attacker.hp - reflectDamage);
      results.push(this.createResult(true, 'attacker', 'reflect', `反弹${reflectDamage}点伤害`, reflectDamage));
    }
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.REFLECT &&
           typeof params.reflectRatio === 'number' && params.reflectRatio > 0 && params.reflectRatio <= 1;
  }
}
