import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

// ==================== Sacrifice ====================

/**
 * 献祭效果参数接口
 */
export interface ISacrificeParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'sacrifice';
  /** 献祭模式（hp_percent=HP百分比，hp_fixed=固定HP，instant_ko=直接击倒） */
  mode: 'hp_percent' | 'hp_fixed' | 'instant_ko';
  /** 献祭值（hp_percent模式为百分比0-100，hp_fixed模式为固定值） */
  value?: number;
  /** 威力加成（可选，献祭HP越多威力越高） */
  powerBonus?: number;
  /** 是否在击倒自己后仍然造成伤害（可选，默认true） */
  damageAfterKo?: boolean;
}

/**
 * 献祭效果
 *
 * 功能：
 * - 消耗自己的HP来增强技能效果
 * - 支持百分比、固定值、直接击倒三种模式
 * - 可根据献祭HP量提升威力
 * - 可选择击倒后是否仍造成伤害
 *
 * 使用场景：
 * - 自爆（消耗所有HP，造成巨额伤害）
 * - 舍身冲撞（消耗50%HP，威力提升）
 * - 生命献祭（消耗固定HP，威力大幅提升）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "sacrifice",
 *   "mode": "hp_percent",
 *   "value": 50,
 *   "powerBonus": 1.5,
 *   "damageAfterKo": true
 * }
 * ```
 *
 * 计算公式：
 * - 威力 = 基础威力 × (1 + 献祭HP百分比 × powerBonus)
 * - 例如：献祭50%HP，powerBonus=1.5，则威力 = 基础威力 × 1.75
 */
export class Sacrifice extends BaseAtomicEffect {
  private mode: 'hp_percent' | 'hp_fixed' | 'instant_ko';
  private value: number;
  private powerBonus: number;
  private damageAfterKo: boolean;

  constructor(params: ISacrificeParams) {
    super(
      AtomicEffectType.SPECIAL,
      'Sacrifice',
      [EffectTiming.BEFORE_DAMAGE_CALC]
    );

    this.mode = params.mode;
    this.value = params.value ?? 0;
    this.powerBonus = params.powerBonus ?? 0;
    this.damageAfterKo = params.damageAfterKo ?? true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    const currentHp = attacker.hp ?? 0;
    const maxHp = attacker.maxHp ?? 0;
    let sacrificeHp = 0;

    // 计算献祭HP
    switch (this.mode) {
      case 'hp_percent':
        sacrificeHp = Math.floor(maxHp * this.value / 100);
        break;
      case 'hp_fixed':
        sacrificeHp = this.value;
        break;
      case 'instant_ko':
        sacrificeHp = currentHp;
        break;
    }

    // 确保不超过当前HP
    sacrificeHp = Math.min(sacrificeHp, currentHp);

    if (sacrificeHp <= 0) {
      results.push(
        this.createResult(
          false,
          'attacker',
          'sacrifice',
          'HP不足，无法献祭',
          0
        )
      );
      return results;
    }

    // 扣除HP
    attacker.hp = Math.max(0, currentHp - sacrificeHp);
    const isKo = attacker.hp === 0;

    results.push(
      this.createResult(
        true,
        'attacker',
        'sacrifice',
        `献祭了${sacrificeHp}HP！`,
        sacrificeHp,
        {
          sacrificeHp,
          remainingHp: attacker.hp,
          isKo
        }
      )
    );

    // 如果有威力加成，应用到技能威力
    if (this.powerBonus > 0 && context.skill) {
      const hpPercent = sacrificeHp / maxHp;
      const powerMultiplier = 1 + (hpPercent * this.powerBonus);
      const originalPower = context.skill.power;
      context.skill.power = Math.floor(originalPower * powerMultiplier);

      results.push(
        this.createResult(
          true,
          'attacker',
          'power_boost',
          `威力提升！${originalPower}→${context.skill.power}`,
          context.skill.power - originalPower,
          {
            originalPower,
            newPower: context.skill.power,
            powerMultiplier
          }
        )
      );

      this.log(
        `献祭威力加成: 献祭${sacrificeHp}HP (${Math.round(hpPercent * 100)}%), ` +
        `威力${originalPower}→${context.skill.power} (×${powerMultiplier.toFixed(2)})`
      );
    }

    // 如果击倒自己且不允许造成伤害，设置伤害为0
    if (isKo && !this.damageAfterKo) {
      context.damage = 0;
      results.push(
        this.createResult(
          true,
          'attacker',
          'sacrifice_ko',
          '献祭击倒了自己！',
          0
        )
      );
    }

    this.log(
      `献祭效果: 消耗${sacrificeHp}HP, 剩余${attacker.hp}HP` +
      (isKo ? ' (击倒)' : '')
    );

    return results;
  }

  public validate(params: any): boolean {
    if (!['hp_percent', 'hp_fixed', 'instant_ko'].includes(params.mode)) {
      this.log('mode必须是hp_percent、hp_fixed或instant_ko', 'error');
      return false;
    }
    if (params.mode !== 'instant_ko' && params.value === undefined) {
      this.log('hp_percent和hp_fixed模式需要指定value', 'error');
      return false;
    }
    if (params.mode === 'hp_percent' && (params.value < 0 || params.value > 100)) {
      this.log('hp_percent模式的value必须在0-100之间', 'error');
      return false;
    }
    return true;
  }
}

// ==================== SacrificeCrit ====================

/**
 * 献祭暴击效果参数接口
 */
export interface ISacrificeCritParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'sacrifice_crit';
  /** HP消耗模式：hp_percent=百分比, hp_fixed=固定值 */
  mode: 'hp_percent' | 'hp_fixed';
  /** HP消耗值（百分比0-100或固定值） */
  hpCost: number;
  /** 暴击率提升值（0-100） */
  critBoost: number;
  /** 是否必定暴击 */
  guaranteedCrit?: boolean;
}

/**
 * 献祭暴击效果
 *
 * 功能：
 * - 消耗自己的HP来提升暴击率
 * - 支持百分比或固定值HP消耗
 * - 可设置必定暴击
 * - HP消耗在技能使用前执行
 *
 * 使用场景：
 * - 背水一战（消耗50%HP，必定暴击）
 * - 生命赌博（消耗30%HP，暴击率+50%）
 * - 血之契约（消耗100HP，暴击率+30%）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "sacrifice_crit",
 *   "mode": "hp_percent",
 *   "hpCost": 50,
 *   "critBoost": 50,
 *   "guaranteedCrit": false
 * }
 * ```
 *
 * 与Sacrifice的区别：
 * - Sacrifice: 消耗HP提升威力
 * - SacrificeCrit: 消耗HP提升暴击率
 */
export class SacrificeCrit extends BaseAtomicEffect {
  private mode: 'hp_percent' | 'hp_fixed';
  private hpCost: number;
  private critBoost: number;
  private guaranteedCrit: boolean;

  constructor(params: ISacrificeCritParams) {
    super(
      AtomicEffectType.SPECIAL,
      'SacrificeCrit',
      [EffectTiming.BEFORE_SKILL, EffectTiming.BEFORE_CRIT_CHECK]
    );

    this.mode = params.mode;
    this.hpCost = params.hpCost;
    this.critBoost = params.critBoost;
    this.guaranteedCrit = params.guaranteedCrit ?? false;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    if (!attacker) {
      this.log('献祭暴击效果：攻击者不存在', 'warn');
      return results;
    }

    // BEFORE_SKILL: 消耗HP
    if (context.timing === EffectTiming.BEFORE_SKILL) {
      let hpToSacrifice = 0;

      if (this.mode === 'hp_percent') {
        hpToSacrifice = Math.floor(attacker.maxHp * (this.hpCost / 100));
      } else {
        hpToSacrifice = this.hpCost;
      }

      // 确保不会消耗超过当前HP-1（至少保留1HP）
      hpToSacrifice = Math.min(hpToSacrifice, attacker.hp - 1);
      hpToSacrifice = Math.max(0, hpToSacrifice);

      if (hpToSacrifice > 0) {
        attacker.hp -= hpToSacrifice;

        results.push(
          this.createResult(
            true,
            'attacker',
            'sacrifice_crit',
            `献祭${hpToSacrifice}HP提升暴击率`,
            hpToSacrifice,
            { mode: this.mode, hpCost: this.hpCost }
          )
        );

        this.log(`献祭暴击效果：消耗${hpToSacrifice}HP`);
      }
    }

    // BEFORE_CRIT_CHECK: 提升暴击率
    if (context.timing === EffectTiming.BEFORE_CRIT_CHECK) {
      if (this.guaranteedCrit) {
        context.critRate = 100;
        results.push(
          this.createResult(
            true,
            'attacker',
            'crit_boost',
            '必定暴击',
            100
          )
        );
        this.log('献祭暴击效果：必定暴击');
      } else {
        const oldCritRate = context.critRate || 0;
        context.critRate = Math.min(100, oldCritRate + this.critBoost);

        results.push(
          this.createResult(
            true,
            'attacker',
            'crit_boost',
            `暴击率+${this.critBoost}%`,
            this.critBoost,
            { oldCritRate, newCritRate: context.critRate }
          )
        );

        this.log(`献祭暴击效果：暴击率从${oldCritRate}%提升到${context.critRate}%`);
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (!params.mode || !['hp_percent', 'hp_fixed'].includes(params.mode)) {
      this.log('献祭暴击效果：mode必须是hp_percent或hp_fixed', 'error');
      return false;
    }

    if (typeof params.hpCost !== 'number' || params.hpCost <= 0) {
      this.log('献祭暴击效果：hpCost必须是正数', 'error');
      return false;
    }

    if (params.mode === 'hp_percent' && (params.hpCost < 0 || params.hpCost > 100)) {
      this.log('献祭暴击效果：百分比模式下hpCost必须在0-100之间', 'error');
      return false;
    }

    if (typeof params.critBoost !== 'number' || params.critBoost < 0 || params.critBoost > 100) {
      this.log('献祭暴击效果：critBoost必须在0-100之间', 'error');
      return false;
    }

    return true;
  }
}

// ==================== SacrificeDamage ====================

/**
 * 牺牲固定伤害参数接口
 */
export interface ISacrificeDamageParams {
  /** 最小伤害 */
  minDamage: number;
  /** 最大伤害 */
  maxDamage: number;
  /** 是否留1HP */
  leaveOneHp?: boolean;
}

/**
 * 牺牲固定伤害效果
 *
 * 牺牲全部体力造成固定伤害，致命伤害时对手剩下1HP
 *
 * @category Special
 * @example
 * // 牺牲固定伤害
 * {
 *   minDamage: 250,
 *   maxDamage: 300,
 *   leaveOneHp: true
 * }
 */
export class SacrificeDamage extends BaseAtomicEffect {
  private minDamage: number;
  private maxDamage: number;
  private leaveOneHp: boolean;

  constructor(params: ISacrificeDamageParams) {
    super(AtomicEffectType.SPECIAL, 'SacrificeDamage', []);
    this.minDamage = params.minDamage;
    this.maxDamage = params.maxDamage;
    this.leaveOneHp = params.leaveOneHp !== false;
  }

  public validate(params: any): boolean {
    return this.minDamage > 0 && this.maxDamage >= this.minDamage;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, defender } = context;

    // 牺牲攻击者全部HP
    attacker.hp = 0;

    // 计算随机伤害
    const damage = Math.floor(Math.random() * (this.maxDamage - this.minDamage + 1)) + this.minDamage;

    // 应用伤害
    let actualDamage = damage;
    if (this.leaveOneHp && damage >= defender.hp) {
      // 致命伤害时留1HP
      actualDamage = defender.hp - 1;
    }

    defender.hp = Math.max(1, defender.hp - actualDamage);

    return [this.createResult(
      true,
      'both',
      'sacrifice_damage',
      `牺牲固定伤害（${actualDamage}点）`,
      actualDamage,
      {
        sacrificed: true,
        damage: actualDamage,
        leaveOneHp: this.leaveOneHp
      }
    )];
  }
}
