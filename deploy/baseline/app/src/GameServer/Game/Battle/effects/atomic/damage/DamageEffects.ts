import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IFixedDamageParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

// ============================================================
// ContinuousDamage
// ============================================================

export interface IContinuousDamageParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'continuous_damage';
  target: 'self' | 'opponent';
  duration: number;
  damageRatio?: number;
  damageAmount?: number;
}

/**
 * 持续伤害原子效果
 * 每回合对目标造成固定伤害或比例伤害
 *
 * @example
 * // 每回合造成最大HP的1/8伤害，持续5回合
 * { type: 'special', specialType: 'continuous_damage', target: 'opponent', duration: 5, damageRatio: 0.125 }
 */
export class ContinuousDamage extends BaseAtomicEffect {
  private params: IContinuousDamageParams;

  constructor(params: IContinuousDamageParams) {
    super(AtomicEffectType.SPECIAL, 'Continuous Damage', [EffectTiming.TURN_END]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const target = this.getTarget(context, this.params.target);
    if (!target) return results;

    let damageAmount = 0;
    if (this.params.damageRatio !== undefined) {
      damageAmount = Math.floor(target.maxHp * this.params.damageRatio);
    } else if (this.params.damageAmount !== undefined) {
      damageAmount = this.params.damageAmount;
    } else {
      damageAmount = Math.floor(target.maxHp / 8);
    }

    damageAmount = Math.max(1, damageAmount);
    const actualDamage = Math.min(damageAmount, target.hp);

    if (actualDamage > 0) {
      target.hp -= actualDamage;
      results.push(this.createResult(
        true,
        this.params.target === 'self' ? 'attacker' : 'defender',
        'continuous_damage',
        `受到${actualDamage}点持续伤害`,
        actualDamage
      ));
    }
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'continuous_damage' &&
           ['self', 'opponent'].includes(params.target) &&
           typeof params.duration === 'number' && params.duration >= 1;
  }
}

// ============================================================
// DamagePercentAdd
// ============================================================

export interface IDamagePercentAddParams {
  type: AtomicEffectType.DAMAGE_MODIFIER;
  percent: number;
}

/**
 * 伤害值百分比附加原子效果
 * 附加所造成伤害值X%的固定伤害
 *
 * @example
 * // 附加50%伤害
 * { type: 'damage_modifier', percent: 50 }
 */
export class DamagePercentAdd extends BaseAtomicEffect {
  private percent: number;

  constructor(params: IDamagePercentAddParams) {
    super(AtomicEffectType.DAMAGE_MODIFIER, 'Damage Percent Add', [EffectTiming.AFTER_DAMAGE_CALC]);
    this.percent = params.percent || 50;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const damage = context.damage || 0;

    if (damage > 0) {
      const bonusDamage = Math.floor(damage * this.percent / 100);

      if (bonusDamage > 0 && context.defender) {
        const actualBonus = Math.min(bonusDamage, context.defender.hp);
        context.defender.hp = Math.max(0, context.defender.hp - actualBonus);

        results.push(this.createResult(
          true,
          'defender',
          'damage_percent_add',
          `附加${this.percent}%伤害: +${actualBonus}`,
          actualBonus
        ));

        // 更新总伤害
        context.damage = (context.damage || 0) + actualBonus;
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    return params && typeof params.percent === 'number' && params.percent >= 0;
  }
}

// ============================================================
// FixedDamageEffect
// ============================================================

/**
 * 固定伤害原子效果
 * 造成固定数值的伤害，不受能力值影响
 *
 * @example
 * // 秒杀对方
 * { type: 'fixed_damage', target: 'opponent', mode: 'instant_kill' }
 *
 * // 造成固定40点伤害
 * { type: 'fixed_damage', target: 'opponent', mode: 'fixed', value: 40 }
 *
 * // 造成对方最大HP的50%伤害
 * { type: 'fixed_damage', target: 'opponent', mode: 'percent', value: 0.5 }
 *
 * // 造成双方HP差值的伤害
 * { type: 'fixed_damage', target: 'opponent', mode: 'hp_difference', multiplier: 1 }
 */
export class FixedDamageEffect extends BaseAtomicEffect {
  private params: IFixedDamageParams;

  constructor(params: IFixedDamageParams) {
    super(AtomicEffectType.FIXED_DAMAGE, 'Fixed Damage', [EffectTiming.BEFORE_DAMAGE_CALC]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    let damage = 0;
    if (this.params.mode === 'instant_kill') {
      damage = context.defender.hp;
    } else if (this.params.mode === 'fixed') {
      damage = this.params.value || 0;
    } else if (this.params.mode === 'percent') {
      damage = (this.params as any).divisor > 0 ? Math.floor(context.defender.maxHp / (this.params as any).divisor) : Math.floor(context.defender.maxHp * (this.params.value || 0));
    } else if (this.params.mode === 'hp_difference') {
      // HP差值伤害：攻击方HP - 防御方HP的绝对值
      const hpDiff = Math.abs(context.attacker.hp - context.defender.hp);
      const multiplier = this.params.multiplier || 1;
      damage = Math.floor(hpDiff * multiplier);
      this.log(
        `HP差值伤害: 攻击方HP=${context.attacker.hp}, 防御方HP=${context.defender.hp}, ` +
        `差值=${hpDiff}, 倍率=${multiplier}, 伤害=${damage}`,
        'info'
      );
    }

    if (damage > 0) {
      // 不直接修改HP，而是通过修改context.damage来影响伤害计算
      // 这样伤害会通过正常的战斗动画显示
      context.damage = damage;
      this.log(`设置固定伤害=${damage}`, 'info');

      results.push(this.createResult(
        true,
        this.params.target === 'self' ? 'attacker' : 'defender',
        'fixed_damage',
        `造成${damage}点固定伤害`,
        damage, { mode: this.params.mode }
      ));
    }
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.FIXED_DAMAGE &&
           ['self', 'opponent'].includes(params.target) &&
           ['instant_kill', 'fixed', 'percent', 'hp_difference'].includes(params.mode);
  }
}

// ============================================================
// HpCostDamage
// ============================================================

/**
 * HP消耗伤害效果参数接口
 */
export interface IHpCostDamageParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'hp_cost_damage';
  /** HP消耗模式：percent=百分比, fixed=固定值 */
  mode: 'percent' | 'fixed';
  /** HP消耗值（百分比0-100或固定值） */
  cost: number;
  /** 伤害倍率（消耗的HP × 倍率 = 造成的伤害） */
  damageMultiplier?: number;
}

/**
 * HP消耗伤害效果
 *
 * 功能：
 * - 消耗自己的HP，根据消耗量造成伤害
 * - 支持百分比或固定值HP消耗
 * - 可设置伤害倍率
 * - 至少保留1HP
 *
 * 使用场景：
 * - 生命爆发（消耗50%HP，造成消耗量×1.5的伤害）
 * - 血之利刃（消耗100HP，造成消耗量×2的伤害）
 * - 献祭打击（消耗30%HP，造成等量伤害）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "damage",
 *   "mode": "percent",
 *   "cost": 50,
 *   "damageMultiplier": 1.5
 * }
 * ```
 *
 * 计算公式：
 * - 伤害 = 消耗的HP × damageMultiplier
 * - 例如：消耗200HP，倍率1.5，则造成300伤害
 *
 * 与Sacrifice的区别：
 * - Sacrifice: 消耗HP提升威力（影响伤害计算）
 * - HpCostDamage: 消耗HP直接转换为伤害（固定伤害）
 */
export class HpCostDamage extends BaseAtomicEffect {
  private mode: 'percent' | 'fixed';
  private cost: number;
  private damageMultiplier: number;

  constructor(params: IHpCostDamageParams) {
    super(
      AtomicEffectType.SPECIAL,
      'HpCostDamage',
      [EffectTiming.BEFORE_DAMAGE_CALC]
    );

    this.mode = params.mode;
    this.cost = params.cost;
    this.damageMultiplier = params.damageMultiplier ?? 1.0;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);

    if (!attacker || !defender) {
      this.log('HP消耗伤害效果：攻击者或防御者不存在', 'warn');
      return results;
    }

    // 计算HP消耗
    let hpCost = 0;

    if (this.mode === 'percent') {
      hpCost = Math.floor(attacker.maxHp * (this.cost / 100));
    } else {
      hpCost = this.cost;
    }

    // 确保不会消耗超过当前HP-1（至少保留1HP）
    hpCost = Math.min(hpCost, attacker.hp - 1);
    hpCost = Math.max(0, hpCost);

    if (hpCost <= 0) {
      this.log('HP消耗伤害效果：HP不足，无法消耗', 'warn');
      return results;
    }

    // 消耗HP
    attacker.hp -= hpCost;

    // 计算造成的伤害
    const damage = Math.floor(hpCost * this.damageMultiplier);

    // 设置为固定伤害
    context.damage = damage;
    context.effectData = context.effectData || {};
    context.effectData.isFixedDamage = true;

    results.push(
      this.createResult(
        true,
        'attacker',
        'hp_cost',
        `消耗${hpCost}HP`,
        hpCost,
        { mode: this.mode, cost: this.cost }
      )
    );

    results.push(
      this.createResult(
        true,
        'defender',
        'damage',
        `造成${damage}伤害`,
        damage,
        { hpCost, damageMultiplier: this.damageMultiplier }
      )
    );

    this.log(`HP消耗伤害效果：消耗${hpCost}HP，造成${damage}伤害`);

    return results;
  }

  public validate(params: any): boolean {
    if (!params.mode || !['percent', 'fixed'].includes(params.mode)) {
      this.log('HP消耗伤害效果：mode必须是percent或fixed', 'error');
      return false;
    }

    if (typeof params.cost !== 'number' || params.cost <= 0) {
      this.log('HP消耗伤害效果：cost必须是正数', 'error');
      return false;
    }

    if (params.mode === 'percent' && (params.cost < 0 || params.cost > 100)) {
      this.log('HP消耗伤害效果：百分比模式下cost必须在0-100之间', 'error');
      return false;
    }

    if (params.damageMultiplier !== undefined && (typeof params.damageMultiplier !== 'number' || params.damageMultiplier <= 0)) {
      this.log('HP消耗伤害效果：damageMultiplier必须是正数', 'error');
      return false;
    }

    return true;
  }
}

// ============================================================
// LeechSeed
// ============================================================

/**
 * 寄生种子参数接口
 */
export interface ILeechSeedParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'leech_seed';
  damageRatio: number;          // 伤害比例（基于目标最大HP）
  duration: number;             // 持续回合数
  immuneTypes?: number[];       // 免疫的属性类型（如草系）
  healAttacker?: boolean;       // 是否回复攻击者HP
}

/**
 * 寄生种子原子效果
 * 每回合吸取对方最大HP的一定比例，持续N回合
 *
 * 用途：
 * - Effect_13: 持续吸取（每回合1/8最大HP）
 *
 * 特性：
 * - 对特定属性免疫（如草系）
 * - 可以回复攻击者HP
 * - 持续多回合
 *
 * @example
 * // 每回合吸取1/8最大HP，持续5回合，草系免疫
 * {
 *   type: 'special',
 *   specialType: 'leech_seed',
 *   damageRatio: 0.125,
 *   duration: 5,
 *   immuneTypes: [12], // 草系
 *   healAttacker: true
 * }
 *
 * @category Damage
 */
export class LeechSeed extends BaseAtomicEffect {
  private params: ILeechSeedParams;

  constructor(params: ILeechSeedParams) {
    super(AtomicEffectType.SPECIAL, 'Leech Seed', [EffectTiming.TURN_END]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = context.attacker;
    const defender = context.defender;

    // 检查免疫
    if (this.params.immuneTypes && this.params.immuneTypes.includes(defender.type)) {
      results.push(this.createResult(
        false,
        'defender',
        'leech_seed_immune',
        `${this.getTypeName(defender.type)}系免疫寄生种子`,
        0
      ));

      this.log(`目标${defender.name}免疫寄生种子（${this.getTypeName(defender.type)}系）`);
      return results;
    }

    // 计算吸取伤害
    const drainAmount = Math.floor(defender.maxHp * this.params.damageRatio);
    const actualDamage = Math.min(drainAmount, defender.hp);

    if (actualDamage > 0) {
      // 对目标造成伤害
      defender.hp -= actualDamage;

      results.push(this.createResult(
        true,
        'defender',
        'leech_seed_damage',
        `被寄生种子吸取${actualDamage}点HP`,
        actualDamage
      ));

      // 回复攻击者HP
      if (this.params.healAttacker && attacker.hp < attacker.maxHp) {
        const healAmount = Math.min(actualDamage, attacker.maxHp - attacker.hp);
        attacker.hp += healAmount;

        results.push(this.createResult(
          true,
          'attacker',
          'leech_seed_heal',
          `通过寄生种子回复${healAmount}点HP`,
          healAmount
        ));

        this.log(`寄生种子: 吸取${actualDamage}HP, 回复${healAmount}HP`);
      } else {
        this.log(`寄生种子: 吸取${actualDamage}HP`);
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    return params &&
           params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'leech_seed' &&
           typeof params.damageRatio === 'number' &&
           params.damageRatio > 0 &&
           params.damageRatio <= 1 &&
           typeof params.duration === 'number' &&
           params.duration > 0;
  }

  /**
   * 获取属性名称
   */
  private getTypeName(type: number): string {
    const typeNames: { [key: number]: string } = {
      0: '普通', 1: '水', 2: '火', 3: '草', 4: '电',
      5: '冰', 6: '战斗', 7: '地面', 8: '飞行', 9: '超能',
      10: '虫', 11: '岩石', 12: '草', 13: '鬼', 14: '龙',
      15: '恶', 16: '钢', 17: '妖精', 18: '光', 19: '暗影'
    };
    return typeNames[type] || '未知';
  }
}

// ============================================================
// MultiHit
// ============================================================

export interface IMultiHitParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'multi_hit';
  minHits: number;
  maxHits: number;
}

/**
 * 连续攻击原子效果
 * 在一回合内连续攻击X~Y次
 *
 * @example
 * // 连续攻击2-5次
 * { type: 'special', specialType: 'multi_hit', minHits: 2, maxHits: 5 }
 */
export class MultiHit extends BaseAtomicEffect {
  private params: IMultiHitParams;

  constructor(params: IMultiHitParams) {
    super(AtomicEffectType.SPECIAL, 'Multi Hit', [EffectTiming.BEFORE_DAMAGE_CALC]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const hitCount = Math.floor(Math.random() * (this.params.maxHits - this.params.minHits + 1) + this.params.minHits);

    if (!context.effectData) context.effectData = {};
    context.effectData.multiHitCount = hitCount;

    results.push(this.createResult(
      true,
      'both',
      'multi_hit',
      `将连续攻击${hitCount}次`,
      hitCount
    ));
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'multi_hit' &&
           typeof params.minHits === 'number' && params.minHits >= 1 &&
           typeof params.maxHits === 'number' && params.maxHits >= params.minHits;
  }
}

// ============================================================
// RandomPower
// ============================================================

export interface IRandomPowerParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'random_power';
  minPower: number;
  maxPower: number;
}

/**
 * 随机威力原子效果
 * 技能威力在指定范围内随机
 *
 * @example
 * // 威力在50-150之间随机
 * { type: 'special', specialType: 'random_power', minPower: 50, maxPower: 150 }
 */
export class RandomPower extends BaseAtomicEffect {
  private params: IRandomPowerParams;

  constructor(params: IRandomPowerParams) {
    super(AtomicEffectType.SPECIAL, 'Random Power', [EffectTiming.BEFORE_DAMAGE_CALC]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const power = Math.floor(Math.random() * (this.params.maxPower - this.params.minPower + 1) + this.params.minPower);

    if (!context.effectData) context.effectData = {};
    context.effectData.randomPower = power;

    if (context.skill) context.skill.power = power;

    results.push(this.createResult(
      true,
      'both',
      'random_power',
      `技能威力随机为${power}`,
      power
    ));
    return results;
  }

  public validate(params: any): boolean {
    return params && params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'random_power' &&
           typeof params.minPower === 'number' && params.minPower >= 0 &&
           typeof params.maxPower === 'number' && params.maxPower >= params.minPower;
  }
}
