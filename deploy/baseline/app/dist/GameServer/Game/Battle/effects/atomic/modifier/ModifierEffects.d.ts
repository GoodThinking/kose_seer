import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IDamageModifierParams, IPowerModifierParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 命中修正参数接口
 */
export interface IAccuracyModifierParams {
    type: AtomicEffectType.ACCURACY_MODIFIER;
    mode: 'multiply' | 'add' | 'set';
    value: number;
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
export declare class AccuracyModifier extends BaseAtomicEffect {
    private params;
    constructor(params: IAccuracyModifierParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class CategoryEvasion extends BaseAtomicEffect {
    private category;
    private evasionBoost;
    private duration;
    constructor(params: ICategoryEvasionParams);
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 检查技能类别是否匹配
     */
    private checkCategoryMatch;
    /**
     * 获取类别闪避状态
     */
    private getCategoryEvasionState;
    validate(params: any): boolean;
}
/**
 * 暴击修正参数接口
 */
export interface ICritModifierParams {
    type: AtomicEffectType.CRIT_MODIFIER;
    mode: 'multiply' | 'add' | 'set';
    value: number;
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
export declare class CritModifier extends BaseAtomicEffect {
    private params;
    constructor(params: ICritModifierParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class DamageModifier extends BaseAtomicEffect {
    private params;
    constructor(params: IDamageModifierParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class PowerModifier extends BaseAtomicEffect {
    private params;
    constructor(params: IPowerModifierParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 优先级修正参数接口
 */
export interface IPriorityModifierParams {
    type: AtomicEffectType.PRIORITY_MODIFIER;
    mode: 'add' | 'set';
    value: number;
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
export declare class PriorityModifier extends BaseAtomicEffect {
    private params;
    constructor(params: IPriorityModifierParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 集气效果参数接口
 */
export interface IFocusEnergyParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'focus_energy';
    critBonus: number;
    duration: number;
    guaranteedCrit?: boolean;
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
export declare class FocusEnergy extends BaseAtomicEffect {
    private params;
    constructor(params: IFocusEnergyParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 必中效果参数接口
 */
export interface ISureHitParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'sure_hit';
    duration: number;
    ignoreEvasion?: boolean;
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
export declare class SureHit extends BaseAtomicEffect {
    private params;
    constructor(params: ISureHitParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class DamageBoost extends BaseAtomicEffect {
    private multiplier;
    private duration?;
    private skillCategory?;
    private skillType?;
    constructor(params: IDamageBoostParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取增强状态
     */
    private getBoostState;
    /**
     * 获取技能类别数值
     */
    private getSkillCategoryValue;
}
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
export declare class DamageReduction extends BaseAtomicEffect {
    private multiplier;
    private duration?;
    private skillCategory?;
    private skillType?;
    constructor(params: IDamageReductionParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取削弱状态
     */
    private getReductionState;
    /**
     * 获取技能类别数值
     */
    private getSkillCategoryValue;
}
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
export declare class TypePowerBoost extends BaseAtomicEffect {
    private targetType;
    private multiplier;
    private duration?;
    constructor(params: ITypePowerBoostParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    private getBoostState;
    private getTypeName;
}
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
export declare class GenderDamageBoost extends BaseAtomicEffect {
    private targetGender;
    private multiplier;
    constructor(params: IGenderDamageBoostParams);
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 检查性别条件
     */
    private checkGenderCondition;
    validate(params: any): boolean;
}
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
export declare class PriorityBoost extends BaseAtomicEffect {
    private boost;
    private condition;
    private threshold;
    constructor(params: IPriorityBoostParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=ModifierEffects.d.ts.map