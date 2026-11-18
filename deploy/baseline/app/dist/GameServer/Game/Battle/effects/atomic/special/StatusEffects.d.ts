import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { BattleStatus } from '../../../../../../shared/models/BattleModel';
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
export declare class RandomStatusEffect extends BaseAtomicEffect {
    private target;
    private statusList;
    private duration;
    private probability;
    constructor(params: IRandomStatusEffectParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class CumulativeStatus extends BaseAtomicEffect {
    private baseProbability;
    private probabilityIncrease;
    private maxProbability;
    private status;
    private duration;
    private cumulativeCount;
    constructor(params: ICumulativeStatusParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 重置累积计数（战斗结束或切换精灵时调用）
     */
    resetCount(attackerId: number): void;
}
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
export declare class Flammable extends BaseAtomicEffect {
    private chance;
    private duration;
    constructor(params: IFlammableParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
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
export declare class ConditionalStatusAura extends BaseAtomicEffect {
    private duration;
    private status;
    private statusDuration;
    private chance;
    private condition;
    private conditionValue?;
    constructor(params: IConditionalStatusAuraParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    private checkCondition;
}
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
export declare class OnHitConditionalStatus extends BaseAtomicEffect {
    private duration;
    private status;
    private statusDuration;
    private chance;
    private damageThreshold;
    constructor(params: IOnHitConditionalStatusParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=StatusEffects.d.ts.map