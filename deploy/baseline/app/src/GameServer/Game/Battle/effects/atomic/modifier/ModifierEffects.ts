import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IDamageModifierParams, IPowerModifierParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult, EffectTiming } from '../../core/EffectContext';

// ============================================================
// AccuracyModifier
// ============================================================

/**
 * 命中修正参数接口
 */
export interface IAccuracyModifierParams {
  type: AtomicEffectType.ACCURACY_MODIFIER;
  mode: 'multiply' | 'add' | 'set';  // 修正模式：乘法、加法、设置
  value: number;                      // 修正值
}

/**
 * 命中修正原子效果
 * 修改技能的命中率
 *
 * @example
 * // 命中率提升20%
 * { type: 'accuracy_modifier', mode: 'add', value: 20 }
 *
 * // 命中率翻倍
 * { type: 'accuracy_modifier', mode: 'multiply', value: 2 }
 *
 * // 必中
 * { type: 'accuracy_modifier', mode: 'set', value: 100 }
 */
export class AccuracyModifier extends BaseAtomicEffect {
  private params: IAccuracyModifierParams;

  constructor(params: IAccuracyModifierParams) {
    super(
      AtomicEffectType.ACCURACY_MODIFIER,
      'Accuracy Modifier',
      [EffectTiming.BEFORE_HIT_CHECK]
    );
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    if (!context.skill) {
      this.log('技能信息不存在', 'warn');
      return results;
    }

    const oldAccuracy = context.skill.accuracy || 100;
    let newAccuracy = oldAccuracy;

    // 根据模式修正命中率
    switch (this.params.mode) {
      case 'multiply':
        newAccuracy = oldAccuracy * this.params.value;
        break;
      case 'add':
        newAccuracy = oldAccuracy + this.params.value;
        break;
      case 'set':
        newAccuracy = this.params.value;
        break;
    }

    // 限制命中率范围 0-100
    newAccuracy = Math.max(0, Math.min(100, newAccuracy));
    context.skill.accuracy = newAccuracy;

    results.push(
      this.createResult(
        true,
        'both',
        'accuracy_modifier',
        `命中率从${oldAccuracy}%修正为${newAccuracy}%`,
        newAccuracy,
        { oldAccuracy, newAccuracy, mode: this.params.mode }
      )
    );

    this.log(`命中率修正: ${oldAccuracy}% -> ${newAccuracy}% (${this.params.mode})`);
    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.ACCURACY_MODIFIER) {
      return false;
    }

    if (!['multiply', 'add', 'set'].includes(params.mode)) {
      this.log(`无效的修正模式: ${params.mode}`, 'error');
      return false;
    }

    if (typeof params.value !== 'number') {
      this.log(`无效的修正值: ${params.value}`, 'error');
      return false;
    }

    return true;
  }
}

// ============================================================
// CategoryEvasion
// ============================================================

/**
 * 类别闪避效果参数接口
 */
export interface ICategoryEvasionParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'category_evasion';
  /** 技能类别：physical=物理, special=特殊 */
  category: 'physical' | 'special';
  /** 闪避率提升值（0-100） */
  evasionBoost: number;
  /** 持续回合数（0=永久） */
  duration?: number;
}

/**
 * 类别闪避效果
 *
 * 功能：
 * - 提升对特定类别技能的闪避率
 * - 支持物理或特殊技能类别
 * - 可设置持续回合数或永久生效
 * - 状态持久化
 *
 * 使用场景：
 * - 物理闪避（物理技能闪避率+30%）
 * - 特殊闪避（特殊技能闪避率+30%）
 * - 防御姿态（3回合内物理技能闪避率+50%）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "modifier",
 *   "category": "physical",
 *   "evasionBoost": 30,
 *   "duration": 3
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   isActive: boolean;       // 是否激活
 *   remainingTurns: number;  // 剩余回合数
 *   category: string;        // 技能类别
 *   evasionBoost: number;    // 闪避率提升
 * }
 * ```
 */
export class CategoryEvasion extends BaseAtomicEffect {
  private category: 'physical' | 'special';
  private evasionBoost: number;
  private duration: number;

  constructor(params: ICategoryEvasionParams) {
    super(
      AtomicEffectType.SPECIAL,
      'CategoryEvasion',
      [EffectTiming.AFTER_SKILL, EffectTiming.BEFORE_HIT_CHECK, EffectTiming.TURN_END]
    );

    this.category = params.category;
    this.evasionBoost = params.evasionBoost;
    this.duration = params.duration ?? 0;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    if (!defender) {
      this.log('类别闪避效果：防御者不存在', 'warn');
      return results;
    }

    const state = this.getCategoryEvasionState(defender);

    // AFTER_SKILL: 激活效果
    if (context.timing === EffectTiming.AFTER_SKILL) {
      state.isActive = true;
      state.remainingTurns = this.duration;
      state.category = this.category;
      state.evasionBoost = this.evasionBoost;

      results.push(
        this.createResult(
          true,
          'defender',
          'category_evasion',
          `激活${this.category === 'physical' ? '物理' : '特殊'}闪避`,
          this.evasionBoost,
          { duration: this.duration }
        )
      );

      this.log(`类别闪避效果：激活${this.category}闪避，持续${this.duration}回合`);
    }

    // BEFORE_HIT_CHECK: 应用闪避率提升
    if (context.timing === EffectTiming.BEFORE_HIT_CHECK && state.isActive) {
      // 检查技能类别是否匹配
      const skillCategory = (context.skill as any)?.category || context.effectData?.skillCategory;
      const categoryMatches = this.checkCategoryMatch(skillCategory);

      if (categoryMatches) {
        const oldAccuracy = (context as any).accuracy || 100;
        (context as any).accuracy = Math.max(0, oldAccuracy - state.evasionBoost);

        results.push(
          this.createResult(
            true,
            'defender',
            'evasion_boost',
            `闪避率+${state.evasionBoost}%`,
            state.evasionBoost,
            { oldAccuracy, newAccuracy: (context as any).accuracy }
          )
        );

        this.log(`类别闪避效果：命中率从${oldAccuracy}%降低到${(context as any).accuracy}%`);
      }
    }

    // TURN_END: 检查持续时间
    if (context.timing === EffectTiming.TURN_END && state.isActive) {
      if (state.remainingTurns > 0) {
        state.remainingTurns--;

        if (state.remainingTurns === 0) {
          state.isActive = false;

          results.push(
            this.createResult(
              true,
              'defender',
              'category_evasion',
              '类别闪避效果结束',
              0
            )
          );

          this.log('类别闪避效果：效果结束');
        }
      }
    }

    return results;
  }

  /**
   * 检查技能类别是否匹配
   */
  private checkCategoryMatch(skillCategory: any): boolean {
    if (!skillCategory) return false;

    // 处理不同的类别表示方式
    if (typeof skillCategory === 'string') {
      return skillCategory.toLowerCase() === this.category;
    }

    if (typeof skillCategory === 'number') {
      // 0=物理, 1=特殊
      return (skillCategory === 0 && this.category === 'physical') ||
             (skillCategory === 1 && this.category === 'special');
    }

    return false;
  }

  /**
   * 获取类别闪避状态
   */
  private getCategoryEvasionState(pet: any): {
    isActive: boolean;
    remainingTurns: number;
    category: string;
    evasionBoost: number;
  } {
    if (!pet.effectStates) {
      pet.effectStates = {};
    }
    if (!pet.effectStates.categoryEvasion) {
      pet.effectStates.categoryEvasion = {
        isActive: false,
        remainingTurns: 0,
        category: '',
        evasionBoost: 0
      };
    }
    return pet.effectStates.categoryEvasion;
  }

  public validate(params: any): boolean {
    if (!params.category || !['physical', 'special'].includes(params.category)) {
      this.log('类别闪避效果：category必须是physical或special', 'error');
      return false;
    }

    if (typeof params.evasionBoost !== 'number' || params.evasionBoost < 0 || params.evasionBoost > 100) {
      this.log('类别闪避效果：evasionBoost必须在0-100之间', 'error');
      return false;
    }

    if (params.duration !== undefined && (typeof params.duration !== 'number' || params.duration < 0)) {
      this.log('类别闪避效果：duration必须是非负整数', 'error');
      return false;
    }

    return true;
  }
}

// ============================================================
// CritModifier
// ============================================================

/**
 * 暴击修正参数接口
 */
export interface ICritModifierParams {
  type: AtomicEffectType.CRIT_MODIFIER;
  mode: 'multiply' | 'add' | 'set';  // 修正模式：乘法、加法、设置
  value: number;                      // 修正值
}

/**
 * 暴击修正原子效果
 * 修改技能的暴击率
 *
 * @example
 * // 暴击率提升25%
 * { type: 'crit_modifier', mode: 'add', value: 25 }
 *
 * // 暴击率翻倍
 * { type: 'crit_modifier', mode: 'multiply', value: 2 }
 *
 * // 必定暴击
 * { type: 'crit_modifier', mode: 'set', value: 100 }
 */
export class CritModifier extends BaseAtomicEffect {
  private params: ICritModifierParams;

  constructor(params: ICritModifierParams) {
    super(
      AtomicEffectType.CRIT_MODIFIER,
      'Crit Modifier',
      [EffectTiming.BEFORE_CRIT_CHECK]
    );
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    // 获取当前暴击率（默认为0）
    const oldCritRate = context.critRate || 0;
    let newCritRate = oldCritRate;

    // 根据模式修正暴击率
    switch (this.params.mode) {
      case 'multiply':
        newCritRate = oldCritRate * this.params.value;
        break;
      case 'add':
        newCritRate = oldCritRate + this.params.value;
        break;
      case 'set':
        newCritRate = this.params.value;
        break;
    }

    // 限制暴击率范围 0-100
    newCritRate = Math.max(0, Math.min(100, newCritRate));
    context.critRate = newCritRate;

    results.push(
      this.createResult(
        true,
        'both',
        'crit_modifier',
        `暴击率从${oldCritRate}%修正为${newCritRate}%`,
        newCritRate,
        { oldCritRate, newCritRate, mode: this.params.mode }
      )
    );

    this.log(`暴击率修正: ${oldCritRate}% -> ${newCritRate}% (${this.params.mode})`);
    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.CRIT_MODIFIER) {
      return false;
    }

    if (!['multiply', 'add', 'set'].includes(params.mode)) {
      this.log(`无效的修正模式: ${params.mode}`, 'error');
      return false;
    }

    if (typeof params.value !== 'number') {
      this.log(`无效的修正值: ${params.value}`, 'error');
      return false;
    }

    return true;
  }
}
// ============================================================
// DamageModifier
// ============================================================


/**
 * 伤害修正原子效果
 * 修改最终造成的伤害值
 * 
 * @example
 * // 伤害翻倍
 * { type: 'damage_modifier', mode: 'multiply', value: 2 }
 * 
 * // 伤害增加50点
 * { type: 'damage_modifier', mode: 'add', value: 50 }
 * 
 * // 伤害固定为100
 * { type: 'damage_modifier', mode: 'set', value: 100 }
 */
export class DamageModifier extends BaseAtomicEffect {
  private params: IDamageModifierParams;

  constructor(params: IDamageModifierParams) {
    super(
      AtomicEffectType.DAMAGE_MODIFIER,
      'Damage Modifier',
      [EffectTiming.AFTER_DAMAGE_CALC]
    );
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    if (context.damage === undefined) {
      this.log('伤害值不存在', 'warn');
      return results;
    }

    const oldDamage = context.damage;
    let newDamage = oldDamage;

    // 根据模式修正伤害
    switch (this.params.mode) {
      case 'multiply':
        newDamage = Math.floor(oldDamage * (this.params.value || 1));
        break;
      case 'add':
        newDamage = oldDamage + (this.params.value || 0);
        break;
      case 'set':
        newDamage = this.params.value ?? oldDamage;
        break;
      case 'multiply_add':
        // 附加所造成伤害值X%的固定伤害
        const bonusDamage = Math.floor(oldDamage * (this.params.percent || this.params.value || 0) / 100);
        newDamage = oldDamage + bonusDamage;
        break;
    }

    // 确保伤害不为负数
    newDamage = Math.max(0, newDamage);
    context.damage = newDamage;

    results.push(
      this.createResult(
        true,
        'both',
        'damage_modifier',
        `伤害从${oldDamage}修正为${newDamage}`,
        newDamage,
        { oldDamage, newDamage, mode: this.params.mode }
      )
    );

    this.log(`伤害修正: ${oldDamage} -> ${newDamage} (${this.params.mode})`);
    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.DAMAGE_MODIFIER) {
      return false;
    }

    if (!['multiply', 'add', 'set'].includes(params.mode)) {
      this.log(`无效的修正模式: ${params.mode}`, 'error');
      return false;
    }

    if (typeof params.value !== 'number') {
      this.log(`无效的修正值: ${params.value}`, 'error');
      return false;
    }

    return true;
  }
}

// ============================================================
// PowerModifier
// ============================================================


/**
 * 威力修正原子效果
 * 修改技能的威力值
 * 
 * @example
 * // 威力翻倍
 * { type: 'power_modifier', mode: 'multiply', value: 2 }
 * 
 * // 威力增加30
 * { type: 'power_modifier', mode: 'add', value: 30 }
 * 
 * // 威力固定为120
 * { type: 'power_modifier', mode: 'set', value: 120 }
 */
export class PowerModifier extends BaseAtomicEffect {
  private params: IPowerModifierParams;

  constructor(params: IPowerModifierParams) {
    super(
      AtomicEffectType.POWER_MODIFIER,
      'Power Modifier',
      [EffectTiming.BEFORE_DAMAGE_CALC]
    );
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    if (!context.skill) {
      this.log('技能信息不存在', 'warn');
      return results;
    }

    const oldPower = context.skill.power || 0;
    let newPower = oldPower;

    // 根据模式修正威力
    switch (this.params.mode) {
      case 'multiply':
        newPower = Math.floor(oldPower * this.params.value);
        break;
      case 'add':
        newPower = oldPower + this.params.value;
        break;
      case 'set':
        newPower = this.params.value;
        break;
    }

    // 确保威力不为负数
    newPower = Math.max(0, newPower);
    context.skill.power = newPower;

    results.push(
      this.createResult(
        true,
        'both',
        'power_modifier',
        `威力从${oldPower}修正为${newPower}`,
        newPower,
        { oldPower, newPower, mode: this.params.mode }
      )
    );

    this.log(`威力修正: ${oldPower} -> ${newPower} (${this.params.mode})`);
    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.POWER_MODIFIER) {
      return false;
    }

    if (!['multiply', 'add', 'set'].includes(params.mode)) {
      this.log(`无效的修正模式: ${params.mode}`, 'error');
      return false;
    }

    if (typeof params.value !== 'number') {
      this.log(`无效的修正值: ${params.value}`, 'error');
      return false;
    }

    return true;
  }
}

// ============================================================
// PriorityModifier
// ============================================================


/**
 * 优先级修正参数接口
 */
export interface IPriorityModifierParams {
  type: AtomicEffectType.PRIORITY_MODIFIER;
  mode: 'add' | 'set';  // 修正模式：加法、设置
  value: number;         // 修正值
}

/**
 * 优先级修正原子效果
 * 修改技能的优先级（先制度）
 * 
 * @example
 * // 优先级+1（先制攻击）
 * { type: 'priority_modifier', mode: 'add', value: 1 }
 * 
 * // 优先级-1（后手攻击）
 * { type: 'priority_modifier', mode: 'add', value: -1 }
 * 
 * // 优先级固定为2
 * { type: 'priority_modifier', mode: 'set', value: 2 }
 */
export class PriorityModifier extends BaseAtomicEffect {
  private params: IPriorityModifierParams;

  constructor(params: IPriorityModifierParams) {
    super(
      AtomicEffectType.PRIORITY_MODIFIER,
      'Priority Modifier',
      [EffectTiming.BEFORE_SPEED_CHECK]
    );
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];

    if (!context.skill) {
      this.log('技能信息不存在', 'warn');
      return results;
    }

    const oldPriority = context.skill.priority || 0;
    let newPriority = oldPriority;

    // 根据模式修正优先级
    switch (this.params.mode) {
      case 'add':
        newPriority = oldPriority + this.params.value;
        break;
      case 'set':
        newPriority = this.params.value;
        break;
    }

    // 限制优先级范围 -128 到 +127
    newPriority = Math.max(-128, Math.min(127, newPriority));
    context.skill.priority = newPriority;

    results.push(
      this.createResult(
        true,
        'both',
        'priority_modifier',
        `优先级从${oldPriority}修正为${newPriority}`,
        newPriority,
        { oldPriority, newPriority, mode: this.params.mode }
      )
    );

    this.log(`优先级修正: ${oldPriority} -> ${newPriority} (${this.params.mode})`);
    return results;
  }

  public validate(params: any): boolean {
    if (!params || params.type !== AtomicEffectType.PRIORITY_MODIFIER) {
      return false;
    }

    if (!['add', 'set'].includes(params.mode)) {
      this.log(`无效的修正模式: ${params.mode}`, 'error');
      return false;
    }

    if (typeof params.value !== 'number') {
      this.log(`无效的修正值: ${params.value}`, 'error');
      return false;
    }

    return true;
  }
}

// ============================================================
// FocusEnergy
// ============================================================


/**
 * 集气效果参数接口
 */
export interface IFocusEnergyParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'focus_energy';
  critBonus: number;            // 暴击率加成（百分比）
  duration: number;             // 持续回合数
  guaranteedCrit?: boolean;     // 是否必定暴击
}

/**
 * 集气原子效果
 * 在X回合内提升暴击率
 * 
 * 用途：
 * - Effect_32: 持续提升暴击率（3回合，+50%）
 * - Effect_71: 献祭暴击提升（必定暴击）
 * 
 * 特性：
 * - 可以提升暴击率或设置必定暴击
 * - 持续多回合
 * - 可以与其他暴击加成叠加
 * 
 * @example
 * // 3回合内暴击率+50%
 * {
 *   type: 'special',
 *   specialType: 'focus_energy',
 *   critBonus: 50,
 *   duration: 3
 * }
 * 
 * @example
 * // 3回合内必定暴击
 * {
 *   type: 'special',
 *   specialType: 'focus_energy',
 *   critBonus: 0,
 *   duration: 3,
 *   guaranteedCrit: true
 * }
 * 
 * @category Modifier
 */
export class FocusEnergy extends BaseAtomicEffect {
  private params: IFocusEnergyParams;

  constructor(params: IFocusEnergyParams) {
    super(AtomicEffectType.SPECIAL, 'Focus Energy', [EffectTiming.BEFORE_CRIT_CHECK]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    // 如果设置了必定暴击
    if (this.params.guaranteedCrit) {
      context.isCrit = true;
      context.critRateModifier = 100; // 设置为100%确保暴击
      
      results.push(this.createResult(
        true,
        'attacker',
        'focus_energy_guaranteed',
        '集气状态：必定暴击',
        100
      ));
      
      this.log('集气效果: 必定暴击');
    } else {
      // 增加暴击率
      const oldCritRate = context.critRate || 0;
      const newCritRate = oldCritRate + this.params.critBonus;
      context.critRate = newCritRate;
      context.critRateModifier += this.params.critBonus;
      
      results.push(this.createResult(
        true,
        'attacker',
        'focus_energy_boost',
        `集气状态：暴击率+${this.params.critBonus}%`,
        this.params.critBonus,
        { oldCritRate, newCritRate }
      ));
      
      this.log(`集气效果: 暴击率 ${oldCritRate}% -> ${newCritRate}%`);
    }
    
    return results;
  }

  public validate(params: any): boolean {
    return params &&
           params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'focus_energy' &&
           typeof params.duration === 'number' &&
           params.duration > 0 &&
           (typeof params.critBonus === 'number' || params.guaranteedCrit === true);
  }
}

// ============================================================
// SureHit
// ============================================================


/**
 * 必中效果参数接口
 */
export interface ISureHitParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'sure_hit';
  duration: number;             // 持续回合数
  ignoreEvasion?: boolean;      // 是否无视闪避
}

/**
 * 必中原子效果
 * 在X回合内，攻击必定命中
 * 
 * 用途：
 * - Effect_81: 持续必中（3回合）
 * 
 * 特性：
 * - 设置命中率为100%
 * - 可以无视对方的闪避提升
 * - 持续多回合
 * 
 * @example
 * // 3回合内攻击必定命中
 * {
 *   type: 'special',
 *   specialType: 'sure_hit',
 *   duration: 3,
 *   ignoreEvasion: true
 * }
 * 
 * @category Modifier
 */
export class SureHit extends BaseAtomicEffect {
  private params: ISureHitParams;

  constructor(params: ISureHitParams) {
    super(AtomicEffectType.SPECIAL, 'Sure Hit', [EffectTiming.BEFORE_HIT_CHECK]);
    this.params = params;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    
    // 设置必中标志
    context.mustHit = true;
    
    // 设置命中率为100%
    if (context.skill) {
      context.skill.accuracy = 100;
    }
    context.hitRateModifier = 100;
    
    // 如果无视闪避，可以在这里添加额外逻辑
    if (this.params.ignoreEvasion) {
      // 存储到effectData供命中判定使用
      if (!context.effectData) context.effectData = {};
      context.effectData.ignoreEvasion = true;
    }
    
    results.push(this.createResult(
      true,
      'attacker',
      'sure_hit',
      '必中状态：攻击必定命中',
      100,
      { ignoreEvasion: this.params.ignoreEvasion }
    ));
    
    this.log(`必中效果: 攻击必定命中${this.params.ignoreEvasion ? '（无视闪避）' : ''}`);
    
    return results;
  }

  public validate(params: any): boolean {
    return params &&
           params.type === AtomicEffectType.SPECIAL &&
           params.specialType === 'sure_hit' &&
           typeof params.duration === 'number' &&
           params.duration > 0;
  }
}

// ============================================================
// DamageBoost
// ============================================================


/**
 * 伤害增强效果参数接口
 */
export interface IDamageBoostParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'damage_boost';
  /** 增强倍率（如1.5表示伤害提升50%） */
  multiplier: number;
  /** 持续回合数（可选，默认永久） */
  duration?: number;
  /** 是否仅对特定技能类别生效（可选：physical/special） */
  skillCategory?: 'physical' | 'special';
  /** 是否仅对特定属性生效（可选） */
  skillType?: number;
}

/**
 * 伤害增强效果
 * 
 * 功能：
 * - 提升造成的伤害
 * - 可设置持续回合数或永久生效
 * - 可限制特定技能类别或属性
 * - 与DamageModifier的区别：DamageBoost是持续性光环效果
 * 
 * 使用场景：
 * - 力量强化（所有伤害提升50%）
 * - 物理强化（物理伤害提升30%）
 * - 火焰强化（火属性伤害提升50%）
 * 
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "damage_boost",
 *   "multiplier": 1.5,
 *   "duration": 5,
 *   "skillCategory": "physical"
 * }
 * ```
 * 
 * 状态数据结构：
 * ```typescript
 * {
 *   multiplier: number;         // 增强倍率
 *   remainingTurns?: number;    // 剩余回合数
 *   isActive: boolean;          // 是否激活
 *   skillCategory?: string;     // 限制类别
 *   skillType?: number;         // 限制属性
 * }
 * ```
 * 
 * 与DamageModifier的区别：
 * - DamageModifier: 即时修正，单次生效
 * - DamageBoost: 持续光环，多回合生效
 */
export class DamageBoost extends BaseAtomicEffect {
  private multiplier: number;
  private duration?: number;
  private skillCategory?: 'physical' | 'special';
  private skillType?: number;

  constructor(params: IDamageBoostParams) {
    super(
      AtomicEffectType.SPECIAL,
      'DamageBoost',
      [EffectTiming.AFTER_SKILL, EffectTiming.AFTER_DAMAGE_CALC, EffectTiming.TURN_END]
    );

    this.multiplier = params.multiplier;
    this.duration = params.duration;
    this.skillCategory = params.skillCategory;
    this.skillType = params.skillType;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    // 在AFTER_SKILL时机激活光环
    if (context.timing === EffectTiming.AFTER_SKILL) {
      const boostState = this.getBoostState(attacker);
      boostState.isActive = true;
      boostState.multiplier = this.multiplier;
      boostState.skillCategory = this.skillCategory;
      boostState.skillType = this.skillType;
      if (this.duration !== undefined) {
        boostState.remainingTurns = this.duration;
      }

      results.push(
        this.createResult(
          true,
          'attacker',
          'damage_boost_activate',
          `伤害增强激活！伤害提升${Math.round((this.multiplier - 1) * 100)}%`,
          this.multiplier,
          { duration: this.duration }
        )
      );

      this.log(
        `伤害增强激活: ×${this.multiplier}, 持续${this.duration ?? '永久'}回合` +
        (this.skillCategory ? `, 限制类别: ${this.skillCategory}` : '') +
        (this.skillType !== undefined ? `, 限制属性: ${this.skillType}` : '')
      );
    }

    // 在AFTER_DAMAGE_CALC时机应用增强
    if (context.timing === EffectTiming.AFTER_DAMAGE_CALC) {
      const boostState = this.getBoostState(attacker);

      if (!boostState.isActive) {
        return results;
      }

      // 检查技能类别限制
      if (boostState.skillCategory) {
        const categoryValue = this.getSkillCategoryValue(boostState.skillCategory as 'physical' | 'special');
        if (context.skillCategory !== categoryValue) {
          return results;
        }
      }

      // 检查技能属性限制
      if (boostState.skillType !== undefined && context.skillType !== boostState.skillType) {
        return results;
      }

      // 应用伤害增强
      const originalDamage = context.damage;
      context.damage = Math.floor(context.damage * boostState.multiplier);

      results.push(
        this.createResult(
          true,
          'attacker',
          'damage_boost',
          `伤害增强！${originalDamage}→${context.damage}`,
          context.damage - originalDamage,
          {
            originalDamage,
            newDamage: context.damage,
            multiplier: boostState.multiplier
          }
        )
      );

      this.log(`伤害增强: ${originalDamage}→${context.damage} (×${boostState.multiplier})`);
    }

    // 在TURN_END时机检查持续时间
    if (context.timing === EffectTiming.TURN_END) {
      const boostState = this.getBoostState(attacker);

      if (boostState.isActive && boostState.remainingTurns !== undefined) {
        boostState.remainingTurns--;
        if (boostState.remainingTurns <= 0) {
          // 光环结束
          boostState.isActive = false;

          results.push(
            this.createResult(
              true,
              'attacker',
              'damage_boost_end',
              `伤害增强结束了！`,
              0
            )
          );

          this.log(`伤害增强结束`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.multiplier === undefined || params.multiplier <= 0) {
      this.log('multiplier必须大于0', 'error');
      return false;
    }
    if (params.skillCategory && !['physical', 'special'].includes(params.skillCategory)) {
      this.log('skillCategory必须是physical或special', 'error');
      return false;
    }
    return true;
  }

  /**
   * 获取增强状态
   */
  private getBoostState(pet: any): {
    multiplier: number;
    remainingTurns?: number;
    isActive: boolean;
    skillCategory?: string;
    skillType?: number;
  } {
    if (!pet.effectStates) {
      pet.effectStates = {};
    }
    if (!pet.effectStates.damageBoost) {
      pet.effectStates.damageBoost = {
        multiplier: 1.0,
        isActive: false
      };
    }
    return pet.effectStates.damageBoost;
  }

  /**
   * 获取技能类别数值
   */
  private getSkillCategoryValue(category: 'physical' | 'special'): number {
    return category === 'physical' ? 1 : 2;
  }
}

// ============================================================
// DamageReduction
// ============================================================


/**
 * 伤害削弱效果参数接口
 */
export interface IDamageReductionParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'damage_reduction';
  /** 削弱倍率（如0.5表示伤害减少50%） */
  multiplier: number;
  /** 持续回合数（可选，默认永久） */
  duration?: number;
  /** 是否仅对特定技能类别生效（可选：physical/special） */
  skillCategory?: 'physical' | 'special';
  /** 是否仅对特定属性生效（可选） */
  skillType?: number;
}

/**
 * 伤害削弱效果
 * 
 * 功能：
 * - 降低受到的伤害
 * - 可设置持续回合数或永久生效
 * - 可限制特定技能类别或属性
 * - 与DamageShield的区别：DamageReduction是百分比削弱，DamageShield是固定减免
 * 
 * 使用场景：
 * - 防御强化（所有伤害减少30%）
 * - 物理防护（物理伤害减少50%）
 * - 火焰抗性（火属性伤害减少50%）
 * 
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "damage_reduction",
 *   "multiplier": 0.5,
 *   "duration": 5,
 *   "skillCategory": "physical"
 * }
 * ```
 * 
 * 状态数据结构：
 * ```typescript
 * {
 *   multiplier: number;         // 削弱倍率
 *   remainingTurns?: number;    // 剩余回合数
 *   isActive: boolean;          // 是否激活
 *   skillCategory?: string;     // 限制类别
 *   skillType?: number;         // 限制属性
 * }
 * ```
 * 
 * 与DamageShield的区别：
 * - DamageShield: 固定减免（如减少50点伤害）
 * - DamageReduction: 百分比削弱（如减少50%伤害）
 */
export class DamageReduction extends BaseAtomicEffect {
  private multiplier: number;
  private duration?: number;
  private skillCategory?: 'physical' | 'special';
  private skillType?: number;

  constructor(params: IDamageReductionParams) {
    super(
      AtomicEffectType.SPECIAL,
      'DamageReduction',
      [EffectTiming.AFTER_SKILL, EffectTiming.AFTER_DAMAGE_CALC, EffectTiming.TURN_END]
    );

    this.multiplier = params.multiplier;
    this.duration = params.duration;
    this.skillCategory = params.skillCategory;
    this.skillType = params.skillType;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const defender = this.getDefender(context);

    // 在AFTER_SKILL时机激活光环
    if (context.timing === EffectTiming.AFTER_SKILL) {
      const reductionState = this.getReductionState(defender);
      reductionState.isActive = true;
      reductionState.multiplier = this.multiplier;
      reductionState.skillCategory = this.skillCategory;
      reductionState.skillType = this.skillType;
      if (this.duration !== undefined) {
        reductionState.remainingTurns = this.duration;
      }

      results.push(
        this.createResult(
          true,
          'defender',
          'damage_reduction_activate',
          `伤害削弱激活！受到伤害减少${Math.round((1 - this.multiplier) * 100)}%`,
          this.multiplier,
          { duration: this.duration }
        )
      );

      this.log(
        `伤害削弱激活: ×${this.multiplier}, 持续${this.duration ?? '永久'}回合` +
        (this.skillCategory ? `, 限制类别: ${this.skillCategory}` : '') +
        (this.skillType !== undefined ? `, 限制属性: ${this.skillType}` : '')
      );
    }

    // 在AFTER_DAMAGE_CALC时机应用削弱
    if (context.timing === EffectTiming.AFTER_DAMAGE_CALC) {
      const reductionState = this.getReductionState(defender);

      if (!reductionState.isActive) {
        return results;
      }

      // 检查技能类别限制
      if (reductionState.skillCategory) {
        const categoryValue = this.getSkillCategoryValue(reductionState.skillCategory as 'physical' | 'special');
        if (context.skillCategory !== categoryValue) {
          return results;
        }
      }

      // 检查技能属性限制
      if (reductionState.skillType !== undefined && context.skillType !== reductionState.skillType) {
        return results;
      }

      // 应用伤害削弱
      const originalDamage = context.damage;
      context.damage = Math.floor(context.damage * reductionState.multiplier);

      results.push(
        this.createResult(
          true,
          'defender',
          'damage_reduction',
          `伤害削弱！${originalDamage}→${context.damage}`,
          originalDamage - context.damage,
          {
            originalDamage,
            newDamage: context.damage,
            multiplier: reductionState.multiplier
          }
        )
      );

      this.log(`伤害削弱: ${originalDamage}→${context.damage} (×${reductionState.multiplier})`);
    }

    // 在TURN_END时机检查持续时间
    if (context.timing === EffectTiming.TURN_END) {
      const reductionState = this.getReductionState(defender);

      if (reductionState.isActive && reductionState.remainingTurns !== undefined) {
        reductionState.remainingTurns--;
        if (reductionState.remainingTurns <= 0) {
          // 光环结束
          reductionState.isActive = false;

          results.push(
            this.createResult(
              true,
              'defender',
              'damage_reduction_end',
              `伤害削弱结束了！`,
              0
            )
          );

          this.log(`伤害削弱结束`);
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.multiplier === undefined || params.multiplier < 0 || params.multiplier > 1) {
      this.log('multiplier必须在0-1之间', 'error');
      return false;
    }
    if (params.skillCategory && !['physical', 'special'].includes(params.skillCategory)) {
      this.log('skillCategory必须是physical或special', 'error');
      return false;
    }
    return true;
  }

  /**
   * 获取削弱状态
   */
  private getReductionState(pet: any): {
    multiplier: number;
    remainingTurns?: number;
    isActive: boolean;
    skillCategory?: string;
    skillType?: number;
  } {
    if (!pet.effectStates) {
      pet.effectStates = {};
    }
    if (!pet.effectStates.damageReduction) {
      pet.effectStates.damageReduction = {
        multiplier: 1.0,
        isActive: false
      };
    }
    return pet.effectStates.damageReduction;
  }

  /**
   * 获取技能类别数值
   */
  private getSkillCategoryValue(category: 'physical' | 'special'): number {
    return category === 'physical' ? 1 : 2;
  }
}

// ============================================================
// TypePowerBoost
// ============================================================


/**
 * 特定属性技能威力提升效果参数接口
 */
export interface ITypePowerBoostParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'type_power_boost';
  /** 提升的属性类型 */
  targetType: number;
  /** 威力倍率 */
  multiplier: number;
  /** 持续回合数（可选，默认永久） */
  duration?: number;
}

/**
 * 特定属性技能威力提升效果
 * 
 * 功能：
 * - 提升特定属性技能的威力
 * - 可设置持续回合数或永久生效
 * - 支持多种属性类型
 * 
 * 使用场景：
 * - 火焰强化（火属性技能威力×1.5）
 * - 水流强化（水属性技能威力×1.5）
 * - 草木强化（草属性技能威力×1.5）
 * 
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "type_power_boost",
 *   "targetType": 1,
 *   "multiplier": 1.5,
 *   "duration": 5
 * }
 * ```
 */
export class TypePowerBoost extends BaseAtomicEffect {
  private targetType: number;
  private multiplier: number;
  private duration?: number;

  constructor(params: ITypePowerBoostParams) {
    super(
      AtomicEffectType.SPECIAL,
      'TypePowerBoost',
      [EffectTiming.AFTER_SKILL, EffectTiming.BEFORE_DAMAGE_CALC, EffectTiming.TURN_END]
    );

    this.targetType = params.targetType;
    this.multiplier = params.multiplier;
    this.duration = params.duration;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);

    if (context.timing === EffectTiming.AFTER_SKILL) {
      const boostState = this.getBoostState(attacker);
      boostState.isActive = true;
      boostState.targetType = this.targetType;
      boostState.multiplier = this.multiplier;
      if (this.duration !== undefined) {
        boostState.remainingTurns = this.duration;
      }

      results.push(
        this.createResult(
          true,
          'attacker',
          'type_power_boost_activate',
          `${this.getTypeName(this.targetType)}属性技能威力提升！`,
          this.multiplier
        )
      );
    }

    if (context.timing === EffectTiming.BEFORE_DAMAGE_CALC) {
      const boostState = this.getBoostState(attacker);
      if (boostState.isActive && context.skillType === boostState.targetType && context.skill) {
        const originalPower = context.skill.power;
        context.skill.power = Math.floor(originalPower * boostState.multiplier);
        results.push(
          this.createResult(
            true,
            'attacker',
            'type_power_boost',
            `威力提升！${originalPower}→${context.skill.power}`,
            context.skill.power - originalPower
          )
        );
      }
    }

    if (context.timing === EffectTiming.TURN_END) {
      const boostState = this.getBoostState(attacker);
      if (boostState.isActive && boostState.remainingTurns !== undefined) {
        boostState.remainingTurns--;
        if (boostState.remainingTurns <= 0) {
          boostState.isActive = false;
          results.push(
            this.createResult(true, 'attacker', 'type_power_boost_end', `属性威力提升结束！`, 0)
          );
        }
      }
    }

    return results;
  }

  public validate(params: any): boolean {
    if (params.targetType === undefined) {
      this.log('targetType是必需参数', 'error');
      return false;
    }
    if (params.multiplier === undefined || params.multiplier <= 0) {
      this.log('multiplier必须大于0', 'error');
      return false;
    }
    return true;
  }

  private getBoostState(pet: any): any {
    if (!pet.effectStates) pet.effectStates = {};
    if (!pet.effectStates.typePowerBoost) {
      pet.effectStates.typePowerBoost = { isActive: false, targetType: 0, multiplier: 1.0 };
    }
    return pet.effectStates.typePowerBoost;
  }

  private getTypeName(type: number): string {
    const typeNames: { [key: number]: string } = {
      0: '普通', 1: '火', 2: '水', 3: '草', 4: '电', 5: '地面', 6: '飞行',
      7: '机械', 8: '冰', 9: '战斗', 10: '光', 11: '暗影', 12: '神秘', 13: '超能', 14: '龙'
    };
    return typeNames[type] ?? `属性${type}`;
  }
}

// ============================================================
// GenderDamageBoost
// ============================================================


/**
 * 性别伤害增强效果参数接口
 */
export interface IGenderDamageBoostParams {
  type: AtomicEffectType.SPECIAL;
  specialType: 'gender_damage_boost';
  /** 目标性别：male=雄性, female=雌性, same=相同, different=不同 */
  targetGender: 'male' | 'female' | 'same' | 'different';
  /** 伤害倍率（小数或百分比） */
  multiplier: number;
}

/**
 * 性别伤害增强效果
 * 
 * 功能：
 * - 根据目标性别提升伤害
 * - 支持指定性别或相同/不同性别
 * - 可设置伤害倍率
 * - 无性别精灵不受影响
 * 
 * 使用场景：
 * - 魅惑（对异性伤害+50%）
 * - 同性相斥（对同性伤害+30%）
 * - 雄性克制（对雄性伤害+50%）
 * 
 * 配置示例：
 * ```json
 * {
 *   "type": "modifier",
 *   "targetGender": "different",
 *   "multiplier": 1.5
 * }
 * ```
 * 
 * 性别值说明：
 * - 0: 无性别
 * - 1: 雄性
 * - 2: 雌性
 */
export class GenderDamageBoost extends BaseAtomicEffect {
  private targetGender: 'male' | 'female' | 'same' | 'different';
  private multiplier: number;

  constructor(params: IGenderDamageBoostParams) {
    super(
      AtomicEffectType.SPECIAL,
      'GenderDamageBoost',
      [EffectTiming.BEFORE_DAMAGE_CALC]
    );

    this.targetGender = params.targetGender;
    this.multiplier = params.multiplier;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const results: IEffectResult[] = [];
    const attacker = this.getAttacker(context);
    const defender = this.getDefender(context);

    if (!attacker || !defender) {
      this.log('性别伤害增强效果：攻击者或防御者不存在', 'warn');
      return results;
    }

    // 获取性别
    const attackerGender = (attacker as any).gender || 0;
    const defenderGender = (defender as any).gender || 0;

    // 检查是否满足性别条件
    const conditionMet = this.checkGenderCondition(attackerGender, defenderGender);

    if (!conditionMet) {
      this.log('性别伤害增强效果：性别条件不满足', 'warn');
      return results;
    }

    // 应用伤害倍率
    const oldDamage = context.damage || 0;
    context.damage = Math.floor(oldDamage * this.multiplier);

    results.push(
      this.createResult(
        true,
        'both',
        'gender_damage_boost',
        `性别伤害增强×${this.multiplier}`,
        context.damage - oldDamage,
        { 
          targetGender: this.targetGender,
          multiplier: this.multiplier,
          attackerGender,
          defenderGender,
          oldDamage,
          newDamage: context.damage
        }
      )
    );

    this.log(`性别伤害增强效果：伤害从${oldDamage}提升到${context.damage}`);

    return results;
  }

  /**
   * 检查性别条件
   */
  private checkGenderCondition(attackerGender: number, defenderGender: number): boolean {
    // 无性别精灵不受影响
    if (attackerGender === 0 || defenderGender === 0) {
      return false;
    }

    switch (this.targetGender) {
      case 'male':
        return defenderGender === 1;
      case 'female':
        return defenderGender === 2;
      case 'same':
        return attackerGender === defenderGender;
      case 'different':
        return attackerGender !== defenderGender;
      default:
        return false;
    }
  }

  public validate(params: any): boolean {
    if (!params.targetGender || !['male', 'female', 'same', 'different'].includes(params.targetGender)) {
      this.log('性别伤害增强效果：targetGender必须是male、female、same或different', 'error');
      return false;
    }

    if (typeof params.multiplier !== 'number' || params.multiplier <= 0) {
      this.log('性别伤害增强效果：multiplier必须是正数', 'error');
      return false;
    }

    return true;
  }
}

// ============================================================
// PriorityBoost
// ============================================================


/**
 * 优先级提升参数接口
 */
export interface IPriorityBoostParams {
  /** 提升的优先级 */
  boost: number;
  /** 条件类型 */
  condition?: 'always' | 'first_turn' | 'hp_full' | 'hp_low';
  /** 条件阈值（用于hp_low） */
  threshold?: number;
}

/**
 * 优先级提升效果 (PriorityBoost)
 * 
 * 提升技能的优先级，使其更容易先手攻击。
 * 
 * @category Modifier
 */
export class PriorityBoost extends BaseAtomicEffect {
  private boost: number;
  private condition: 'always' | 'first_turn' | 'hp_full' | 'hp_low';
  private threshold: number;

  constructor(params: IPriorityBoostParams) {
    super(AtomicEffectType.SPECIAL, 'PriorityBoost', []);
    this.boost = params.boost;
    this.condition = params.condition || 'always';
    this.threshold = params.threshold || 0.25;
  }

  public validate(params: any): boolean {
    return params && params.boost !== undefined;
  }

  public execute(context: IEffectContext): IEffectResult[] {
    const { attacker, turn } = context;

    // 检查条件
    let shouldBoost = false;
    let reason = '';

    switch (this.condition) {
      case 'always':
        shouldBoost = true;
        reason = '无条件';
        break;

      case 'first_turn':
        shouldBoost = turn === 1;
        reason = '第一回合';
        break;

      case 'hp_full':
        shouldBoost = attacker.hp === attacker.maxHp;
        reason = 'HP满';
        break;

      case 'hp_low':
        shouldBoost = attacker.hp / attacker.maxHp <= this.threshold;
        reason = `HP低于${(this.threshold * 100).toFixed(0)}%`;
        break;
    }

    if (!shouldBoost) {
      return [this.createResult(
        false,
        'attacker',
        'priority',
        `优先级提升条件不满足（${reason}）`
      )];
    }

    // 提升优先级
    if (context.skill) {
      const originalPriority = context.skill.priority || 0;
      context.skill.priority = originalPriority + this.boost;
    }

    return [this.createResult(
      true,
      'attacker',
      'priority',
      `优先级+${this.boost}（${reason}）`,
      this.boost,
      {
        boost: this.boost,
        condition: this.condition,
        reason
      }
    )];
  }
}
