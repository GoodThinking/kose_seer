import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IFixedDamageParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
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
export declare class ContinuousDamage extends BaseAtomicEffect {
    private params;
    constructor(params: IContinuousDamageParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class DamagePercentAdd extends BaseAtomicEffect {
    private percent;
    constructor(params: IDamagePercentAddParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class FixedDamageEffect extends BaseAtomicEffect {
    private params;
    constructor(params: IFixedDamageParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class HpCostDamage extends BaseAtomicEffect {
    private mode;
    private cost;
    private damageMultiplier;
    constructor(params: IHpCostDamageParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 寄生种子参数接口
 */
export interface ILeechSeedParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'leech_seed';
    damageRatio: number;
    duration: number;
    immuneTypes?: number[];
    healAttacker?: boolean;
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
export declare class LeechSeed extends BaseAtomicEffect {
    private params;
    constructor(params: ILeechSeedParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取属性名称
     */
    private getTypeName;
}
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
export declare class MultiHit extends BaseAtomicEffect {
    private params;
    constructor(params: IMultiHitParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class RandomPower extends BaseAtomicEffect {
    private params;
    constructor(params: IRandomPowerParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
//# sourceMappingURL=DamageEffects.d.ts.map