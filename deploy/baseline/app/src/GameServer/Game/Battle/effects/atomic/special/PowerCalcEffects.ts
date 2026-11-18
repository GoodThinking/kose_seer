import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

// ==================== Punishment ====================

/**
 * 惩罚效果参数接口
 */
export interface IPunishmentParams {
  /** 惩罚类型 */
  type: 'stat_boost' | 'status' | 'hp_percent';
  /** 惩罚倍率（每个能力提升/状态增加的伤害倍率） */
  multiplier: number;
  /** 基础威力 */
  basePower?: number;
}

/**
 * 惩罚效果 (Punishment)
 *
 * 根据对手的状态（能力提升、异常状态、HP百分比等）增加伤害。
 * 对手状态越好/越差，伤害越高。
 *
 * **功能：**
 * - stat_boost: 对手能力提升越多，伤害越高
 * - status: 对手异常状态越多，伤害越高
 * - hp_percent: 对手HP越高，伤害越高
 *
 * **使用场景：**
 *
 * 1. **惩罚强化（Effect_35）**
 *    - 对手每有1级能力提升，伤害+20
 *    - 例如：对手攻击+2、速度+1，伤害 = 基础 + 60
 *
 * 2. **惩罚异常状态**
 *    - 对手每有1个异常状态，伤害+30%
 *    - 例如：对手中毒+灼伤，伤害 = 基础 × 1.6
 *
 * 3. **惩罚高HP**
 *    - 对手HP越高，伤害越高
 *    - 例如：对手HP 100%时，伤害 = 基础 × 2.0
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Punishment",
 *   "timing": "BEFORE_DAMAGE_CALC",
 *   "params": {
 *     "type": "stat_boost",
 *     "multiplier": 20,
 *     "basePower": 60
 *   }
 * }
 * ```
 *
 * @category Special
 */
export class Punishment extends BaseAtomicEffect {
  private punishmentType: 'stat_boost' | 'status' | 'hp_percent';
  private multiplier: number;
  private basePower: number;

  constructor(params: IPunishmentParams) {
    super(AtomicEffectType.SPECIAL, 'Punishment', []);
    this.punishmentType = params.type;
    this.multiplier = params.multiplier;
    this.basePower = params.basePower || 60;
  }

  public validate(params: any): boolean {
    return params && params.type && params.multiplier !== undefined;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { defender } = context;
    let bonusPower = 0;

    switch (this.punishmentType) {
      case 'stat_boost': {
        // 计算对手的能力提升总和（只计算正值）
        const battleLv = defender.battleLv || [0, 0, 0, 0, 0, 0];
        const totalBoosts = battleLv.reduce((sum, level) => sum + Math.max(0, level), 0);
        bonusPower = totalBoosts * this.multiplier;
        break;
      }

      case 'status': {
        // 计算对手的异常状态数量
        const statusArray = defender.statusArray || [];
        const statusCount = statusArray.filter(s => s > 0).length;
        bonusPower = statusCount * this.multiplier;
        break;
      }

      case 'hp_percent': {
        // 根据对手HP百分比计算
        const hpPercent = defender.hp / defender.maxHp;
        bonusPower = this.basePower * hpPercent * (this.multiplier - 1);
        break;
      }
    }

    // 修改技能威力
    if (context.skill) {
      const originalPower = context.skill.power || this.basePower;
      context.skill.power = originalPower + bonusPower;
    }

    return [this.createResult(
      true,
      'defender',
      'power_boost',
      `惩罚效果：威力+${bonusPower.toFixed(0)}`,
      bonusPower,
      {
        punishmentType: this.punishmentType,
        bonusPower,
        originalPower: this.basePower
      }
    )];
  }
}

// ==================== Reversal ====================

/**
 * 反转效果参数接口
 */
export interface IReversalParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'reversal';
  /** 反转类型：hp_ratio=HP比例, stat_changes=能力变化 */
  reversalType: 'hp_ratio' | 'stat_changes';
  /** 威力基础值 */
  basePower?: number;
  /** 最大威力 */
  maxPower?: number;
}

/**
 * 反转效果
 *
 * 功能：
 * - HP比例反转：HP越低威力越高
 * - 能力变化反转：将能力提升变为降低，降低变为提升
 * - 可设置威力基础值和最大值
 * - 动态计算威力
 *
 * 使用场景：
 * - 绝地反击（HP越低威力越高，最高200）
 * - 反转世界（交换所有能力变化的正负）
 * - 背水一战（HP低于25%时威力翻倍）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "reversal",
 *   "reversalType": "hp_ratio",
 *   "basePower": 20,
 *   "maxPower": 200
 * }
 * ```
 *
 * HP比例反转计算公式：
 * - 威力 = basePower + (maxPower - basePower) × (1 - HP百分比)
 * - 例如：HP 10%时，威力 = 20 + (200 - 20) × 0.9 = 182
 */
export class Reversal extends BaseAtomicEffect {
  private reversalType: 'hp_ratio' | 'stat_changes';
  private basePower: number;
  private maxPower: number;

  constructor(params: IReversalParams) {
    super(
      AtomicEffectType.SPECIAL,
      'Reversal',
      [EffectTiming.BEFORE_DAMAGE_CALC, EffectTiming.AFTER_SKILL]
    );

    this.reversalType = params.reversalType;
    this.basePower = params.basePower ?? 20;
    this.maxPower = params.maxPower ?? 200;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    switch (this.reversalType) {
      case 'hp_ratio':
        this.applyHpRatioReversal(context, results);
        break;
      case 'stat_changes':
        this.applyStatChangesReversal(context, results);
        break;
    }

    return results;
  }

  /**
   * 应用HP比例反转
   */
  private applyHpRatioReversal(context: IEffectContext, results: IEffectResult[]): void {
    if (context.timing !== EffectTiming.BEFORE_DAMAGE_CALC) {
      return;
    }

    const attacker = this.getAttacker(context);
    if (!attacker) {
      this.log('反转效果：攻击者不存在', 'warn');
      return;
    }

    // 计算HP百分比
    const hpRatio = attacker.hp / attacker.maxHp;

    // 计算威力：HP越低威力越高
    const powerBoost = (this.maxPower - this.basePower) * (1 - hpRatio);
    const finalPower = Math.floor(this.basePower + powerBoost);

    // 修改技能威力
    if (context.skill) {
      context.skill.power = finalPower;
    }
    context.skillPower = finalPower;

    results.push(
      this.createResult(
        true,
        'attacker',
        'reversal',
        `反转威力：${finalPower}（HP ${Math.floor(hpRatio * 100)}%）`,
        finalPower,
        {
          reversalType: 'hp_ratio',
          hpRatio,
          basePower: this.basePower,
          maxPower: this.maxPower
        }
      )
    );

    this.log(`反转效果：HP ${Math.floor(hpRatio * 100)}%，威力${finalPower}`);
  }

  /**
   * 应用能力变化反转
   */
  private applyStatChangesReversal(context: IEffectContext, results: IEffectResult[]): void {
    if (context.timing !== EffectTiming.AFTER_SKILL) {
      return;
    }

    const target = this.getDefender(context);
    if (!target) {
      this.log('反转效果：目标不存在', 'warn');
      return;
    }

    if (!target.battleLevels) {
      target.battleLevels = [0, 0, 0, 0, 0, 0];
    }

    // 反转所有能力变化
    const changes: string[] = [];
    const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];

    for (let i = 0; i < target.battleLevels.length; i++) {
      const oldLevel = target.battleLevels[i];
      if (oldLevel !== 0) {
        target.battleLevels[i] = -oldLevel;
        changes.push(`${statNames[i]}:${oldLevel}→${-oldLevel}`);
      }
    }

    if (changes.length > 0) {
      results.push(
        this.createResult(
          true,
          'defender',
          'reversal',
          `反转能力变化：${changes.join(', ')}`,
          0,
          { reversalType: 'stat_changes', changes }
        )
      );

      this.log(`反转效果：反转能力变化（${changes.join(', ')}）`);
    } else {
      this.log('反转效果：目标没有能力变化', 'warn');
    }
  }

  public validate(params: any): boolean {
    if (!params.reversalType || !['hp_ratio', 'stat_changes'].includes(params.reversalType)) {
      this.log('反转效果：reversalType必须是hp_ratio或stat_changes', 'error');
      return false;
    }

    if (params.reversalType === 'hp_ratio') {
      if (params.basePower !== undefined && (typeof params.basePower !== 'number' || params.basePower < 0)) {
        this.log('反转效果：basePower必须是非负数', 'error');
        return false;
      }

      if (params.maxPower !== undefined && (typeof params.maxPower !== 'number' || params.maxPower < 0)) {
        this.log('反转效果：maxPower必须是非负数', 'error');
        return false;
      }

      if (params.basePower !== undefined && params.maxPower !== undefined && params.basePower >= params.maxPower) {
        this.log('反转效果：basePower必须小于maxPower', 'error');
        return false;
      }
    }

    return true;
  }
}

// ==================== IvPower ====================

/**
 * 个体威力提升参数接口
 */
export interface IIvPowerParams {
  /** 最小威力 */
  minPower: number;
  /** 最大威力 */
  maxPower: number;
  /** IV计算方式 */
  ivType: 'total' | 'average' | 'max';
}

/**
 * 个体威力提升效果
 *
 * 根据个体值提升威力
 *
 * @category Special
 * @example
 * // 个体威力提升
 * {
 *   minPower: 1,
 *   maxPower: 155,
 *   ivType: 'total'
 * }
 */
export class IvPower extends BaseAtomicEffect {
  private minPower: number;
  private maxPower: number;
  private ivType: string;

  constructor(params: IIvPowerParams) {
    super(AtomicEffectType.SPECIAL, 'IvPower', []);
    this.minPower = params.minPower;
    this.maxPower = params.maxPower;
    this.ivType = params.ivType;
  }

  public validate(params: any): boolean {
    return this.maxPower >= this.minPower;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker } = context;

    // 计算个体值（简化实现，使用能力值作为近似）
    const iv = this.calculateIv(attacker);

    // 根据个体值计算威力
    // IV范围通常是0-31，总和0-186
    // 映射到威力范围
    const ivRatio = Math.min(1, iv / 186);
    const power = Math.floor(this.minPower + (this.maxPower - this.minPower) * ivRatio);

    return [this.createResult(
      true,
      'attacker',
      'iv_power',
      `个体威力提升（威力${power}）`,
      power,
      {
        power,
        iv,
        ivType: this.ivType
      }
    )];
  }

  private calculateIv(pet: any): number {
    // 简化实现：使用能力值总和作为个体值近似
    const stats = [
      pet.attack,
      pet.defence,
      pet.spAtk,
      pet.spDef,
      pet.speed,
      pet.maxHp
    ];

    switch (this.ivType) {
      case 'total':
        return stats.reduce((sum, stat) => sum + (stat % 32), 0);
      case 'average':
        return Math.floor(stats.reduce((sum, stat) => sum + (stat % 32), 0) / stats.length);
      case 'max':
        return Math.max(...stats.map(stat => stat % 32));
      default:
        return 0;
    }
  }
}

// ==================== WeightedRandomPower ====================

/**
 * 加权随机威力参数接口
 */
export interface IWeightedRandomPowerParams {
  /** 威力范围列表 */
  powerRanges: Array<{
    min: number;
    max: number;
    weight: number;
  }>;
}

/**
 * 加权随机威力效果
 *
 * 按权重随机选择威力范围
 *
 * @category Special
 * @example
 * // 多段随机威力
 * {
 *   powerRanges: [
 *     { min: 301, max: 350, weight: 0.5 },
 *     { min: 101, max: 300, weight: 0.3 },
 *     { min: 5, max: 100, weight: 0.2 }
 *   ]
 * }
 */
export class WeightedRandomPower extends BaseAtomicEffect {
  private powerRanges: Array<{
    min: number;
    max: number;
    weight: number;
  }>;

  constructor(params: IWeightedRandomPowerParams) {
    super(AtomicEffectType.SPECIAL, 'WeightedRandomPower', []);
    this.powerRanges = params.powerRanges;
  }

  public validate(params: any): boolean {
    if (!this.powerRanges || this.powerRanges.length === 0) {
      return false;
    }

    // 检查权重总和是否为1
    const totalWeight = this.powerRanges.reduce((sum, range) => sum + range.weight, 0);
    return Math.abs(totalWeight - 1) < 0.01;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    // 按权重随机选择范围
    const roll = Math.random();
    let cumulative = 0;
    let selectedRange = this.powerRanges[0];

    for (const range of this.powerRanges) {
      cumulative += range.weight;
      if (roll <= cumulative) {
        selectedRange = range;
        break;
      }
    }

    // 在选中的范围内随机选择威力
    const power = Math.floor(
      Math.random() * (selectedRange.max - selectedRange.min + 1) + selectedRange.min
    );

    return [this.createResult(
      true,
      'attacker',
      'weighted_random_power',
      `加权随机威力（${power}）`,
      power,
      {
        power,
        selectedRange: `${selectedRange.min}-${selectedRange.max}`,
        weight: selectedRange.weight
      }
    )];
  }
}

// ==================== LevelDamage ====================

/**
 * 等级伤害附加参数接口
 */
export interface ILevelDamageParams {
  /** 等级伤害系数 */
  levelMultiplier?: number;
}

/**
 * 等级伤害附加效果
 *
 * 根据自身等级计算额外伤害
 *
 * @category Special
 */
export class LevelDamage extends BaseAtomicEffect {
  private levelMultiplier: number;

  constructor(params: ILevelDamageParams) {
    super(AtomicEffectType.SPECIAL, 'LevelDamage', []);
    this.levelMultiplier = params.levelMultiplier || 1;
  }

  public validate(params: any): boolean {
    return true;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, damage } = context;

    // 计算等级附加伤害
    const level = attacker.level || 1;
    const additionalDamage = Math.floor(level * this.levelMultiplier);

    // 添加到伤害
    if (damage !== undefined) {
      context.damage = damage + additionalDamage;
    }

    return [this.createResult(
      true,
      'attacker',
      'level_damage',
      `等级伤害附加 +${additionalDamage}`,
      additionalDamage,
      {
        level,
        multiplier: this.levelMultiplier,
        additionalDamage
      }
    )];
  }
}

// ==================== Recoil ====================

/**
 * 反作用力参数接口
 */
export interface IRecoilParams {
  /** 反作用力模式 */
  mode: 'damage_percent' | 'max_hp_percent' | 'fixed';
  /** 反作用力比例/数值 */
  value: number;
  /** 是否可以导致自己昏厥 */
  canKo?: boolean;
}

/**
 * 反作用力效果 (Recoil)
 *
 * 使用技能后，自己受到反作用力伤害。
 * 伤害可以基于造成的伤害、最大HP或固定值。
 *
 * **功能：**
 * - damage_percent: 基于造成伤害的百分比
 * - max_hp_percent: 基于自己最大HP的百分比
 * - fixed: 固定伤害
 * - 可选择是否能导致自己昏厥
 *
 * **使用场景：**
 *
 * 1. **猛撞类技能（Effect_11）**
 *    - 造成伤害的1/4反作用力
 *    - 例如：造成100伤害，自己受到25伤害
 *
 * 2. **舍身冲撞**
 *    - 造成伤害的1/3反作用力
 *    - 例如：造成120伤害，自己受到40伤害
 *
 * 3. **爆炸类技能**
 *    - 自己最大HP的50%反作用力
 *    - 可以导致自己昏厥
 *
 * 4. **心灵冲击**
 *    - 固定50点反作用力
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Recoil",
 *   "timing": "AFTER_SKILL",
 *   "params": {
 *     "mode": "damage_percent",
 *     "value": 0.25,
 *     "canKo": false
 *   }
 * }
 * ```
 *
 * @category Special
 */
export class Recoil extends BaseAtomicEffect {
  private mode: 'damage_percent' | 'max_hp_percent' | 'fixed';
  private value: number;
  private canKo: boolean;

  constructor(params: IRecoilParams) {
    super(AtomicEffectType.SPECIAL, 'Recoil', []);
    this.mode = params.mode;
    this.value = params.value;
    this.canKo = params.canKo !== false;
  }

  public validate(params: any): boolean {
    return params && params.mode && params.value !== undefined;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, damage } = context;
    let recoilDamage = 0;

    // 计算反作用力伤害
    switch (this.mode) {
      case 'damage_percent':
        recoilDamage = Math.floor(damage * this.value);
        break;

      case 'max_hp_percent':
        recoilDamage = Math.floor(attacker.maxHp * this.value);
        break;

      case 'fixed':
        recoilDamage = this.value;
        break;
    }

    // 应用反作用力
    if (recoilDamage > 0) {
      const oldHp = attacker.hp;

      if (this.canKo) {
        // 可以导致昏厥
        attacker.hp = Math.max(0, attacker.hp - recoilDamage);
      } else {
        // 不能导致昏厥，至少保留1HP
        attacker.hp = Math.max(1, attacker.hp - recoilDamage);
      }

      const actualDamage = oldHp - attacker.hp;

      return [this.createResult(
        true,
        'attacker',
        'recoil',
        `反作用力：自己受到${actualDamage}点伤害`,
        actualDamage,
        {
          recoilDamage: actualDamage,
          mode: this.mode,
          canKo: this.canKo,
          remainingHp: attacker.hp
        }
      )];
    }

    return [this.createResult(
      false,
      'attacker',
      'recoil',
      '反作用力：无伤害'
    )];
  }
}
