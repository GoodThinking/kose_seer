import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
import { AtomicEffectType } from '../core/IAtomicEffect';
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
 * 持续能力提升效果
 *
 * 每回合自动提升指定的多个能力
 *
 * @category Special
 */
export declare class ContinuousStatBoost extends BaseAtomicEffect {
    private duration;
    private stats;
    private levelChange;
    private target;
    private auras;
    constructor(params: IContinuousStatBoostParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 每回合触发（在回合开始时调用）
     */
    onTurnStart(petId: number, pet: any): IEffectResult[];
    /**
     * 移除光环
     */
    removeAura(petId: number): void;
    /**
     * 检查是否有光环
     */
    hasAura(petId: number): boolean;
}
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
 * 持续多能力变化效果
 *
 * 每回合自动修改多个能力（可以是提升或下降）
 *
 * @category Special
 */
export declare class ContinuousMultiStatBoost extends BaseAtomicEffect {
    private duration;
    private statChanges;
    private target;
    private auras;
    constructor(params: IContinuousMultiStatBoostParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 每回合触发（在回合开始时调用）
     */
    onTurnStart(petId: number, pet: any): IEffectResult[];
    /**
     * 移除光环
     */
    removeAura(petId: number): void;
    /**
     * 检查是否有光环
     */
    hasAura(petId: number): boolean;
}
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
        stat: number;
        change: number;
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
export declare class ContinuousStatChange extends BaseAtomicEffect {
    private duration;
    private statChanges;
    private timing;
    private target;
    constructor(params: IContinuousStatChangeParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class CumulativeCritBoost extends BaseAtomicEffect {
    private critIncrease;
    private maxCritIncrease;
    private cumulativeCrit;
    constructor(params: ICumulativeCritBoostParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 重置累积暴击率（战斗结束或切换精灵时调用）
     */
    resetCrit(attackerId: number): void;
    /**
     * 获取当前累积暴击率
     */
    getCurrentCrit(attackerId: number): number;
}
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
export declare class StatBoostNullify extends BaseAtomicEffect {
    private duration;
    private target;
    constructor(params: IStatBoostNullifyParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class StatBoostReversal extends BaseAtomicEffect {
    private target;
    constructor(params: IStatBoostReversalParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
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
export declare class IgnoreDefenseBuff extends BaseAtomicEffect {
    private ignoreSpDefense;
    constructor(params: IIgnoreDefenseBuffParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=StatEffects.d.ts.map