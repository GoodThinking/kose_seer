import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 吸血参数接口
 */
export interface IAbsorbParams {
    /** 吸血比例（基于造成的伤害） */
    percent: number;
    /** 最小吸血量 */
    minHeal?: number;
    /** 最大吸血量 */
    maxHeal?: number;
}
/**
 * 吸血效果 (Absorb)
 *
 * 根据造成的伤害回复自己的HP。
 * 可以设置最小和最大回复量。
 *
 * **功能：**
 * - 基于伤害的百分比回复
 * - 设置最小回复量（保底）
 * - 设置最大回复量（上限）
 * - 不能超过最大HP
 *
 * **使用场景：**
 *
 * 1. **吸血类技能（Effect_12）**
 *    - 回复造成伤害的50%
 *    - 例如：造成100伤害，回复50 HP
 *
 * 2. **终极吸取**
 *    - 回复造成伤害的75%
 *    - 例如：造成120伤害，回复90 HP
 *
 * 3. **吸血鬼之牙**
 *    - 回复造成伤害的100%
 *    - 最少回复10 HP
 *
 * 4. **生命汲取**
 *    - 回复造成伤害的50%
 *    - 最多回复100 HP
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Absorb",
 *   "timing": "AFTER_DAMAGE_APPLY",
 *   "params": {
 *     "percent": 0.5,
 *     "minHeal": 1,
 *     "maxHeal": 999
 *   }
 * }
 * ```
 *
 * @category Special
 */
export declare class Absorb extends BaseAtomicEffect {
    private percent;
    private minHeal;
    private maxHeal;
    constructor(params: IAbsorbParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 伤害转化为体力参数接口
 */
export interface IDamageToHpParams {
    /** 持续回合数 */
    duration?: number;
    /** 转化比例 */
    conversionRatio?: number;
}
/**
 * 伤害转化为体力效果
 *
 * 持续N回合，受到的伤害转化为自身HP
 *
 * @category Special
 */
export declare class DamageToHp extends BaseAtomicEffect {
    private duration;
    private conversionRatio;
    private auras;
    constructor(params: IDamageToHpParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 受到伤害时触发
     */
    onDamageTaken(petId: number, pet: any, damage: number): IEffectResult[];
    /**
     * 每回合结束时触发
     */
    onTurnEnd(petId: number): void;
    /**
     * 移除光环
     */
    removeAura(petId: number): void;
}
/**
 * 选择目标回复参数接口
 */
export interface ISelectiveHealParams {
    /** 回复比例 */
    healRatio: number;
    /** 目标选择 */
    targetSelection: 'self' | 'ally' | 'all_allies';
}
/**
 * 选择目标回复效果
 *
 * 对选中对象或本方全体恢复体力
 *
 * @category Special
 * @example
 * // 选择目标回复
 * {
 *   healRatio: 0.5,
 *   targetSelection: 'self'
 * }
 */
export declare class SelectiveHeal extends BaseAtomicEffect {
    private healRatio;
    private targetSelection;
    constructor(params: ISelectiveHealParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 延迟全回复参数接口
 */
export interface IDelayedFullHealParams {
    /** 立即回复量 */
    immediateHeal: number;
    /** 延迟回合数 */
    delayTurns: number;
}
/**
 * 延迟全回复效果
 *
 * 立刻恢复部分体力，延迟回合后恢复全部体力
 *
 * @category Special
 * @example
 * // 立即回复延迟全回复
 * {
 *   immediateHeal: 50,
 *   delayTurns: 3
 * }
 */
export declare class DelayedFullHeal extends BaseAtomicEffect {
    private immediateHeal;
    private delayTurns;
    constructor(params: IDelayedFullHealParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * HP消耗效果参数接口
 */
export interface IHpCostParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'hp_cost';
    /** HP消耗模式：percent=百分比, fixed=固定值 */
    mode: 'percent' | 'fixed';
    /** HP消耗值（百分比0-100或固定值） */
    cost: number;
    /** 是否在技能使用前消耗（true=前，false=后） */
    beforeSkill?: boolean;
}
/**
 * HP消耗效果
 *
 * 功能：
 * - 使用技能时消耗自己的HP
 * - 支持百分比或固定值消耗
 * - 可选择在技能使用前或后消耗
 * - 至少保留1HP
 *
 * 使用场景：
 * - 生命代价（使用技能消耗30%HP）
 * - 血之献祭（使用技能消耗100HP）
 * - 透支技能（技能使用后消耗50%HP）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "hp_cost",
 *   "mode": "percent",
 *   "cost": 30,
 *   "beforeSkill": true
 * }
 * ```
 *
 * 与Sacrifice的区别：
 * - Sacrifice: 消耗HP提升威力
 * - HpCost: 单纯消耗HP作为代价
 */
export declare class HpCost extends BaseAtomicEffect {
    private mode;
    private cost;
    private beforeSkill;
    constructor(params: IHpCostParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 同生共死参数接口
 */
export interface IHpEqualParams {
    /** 目标HP设置模式 */
    mode: 'equal_to_self' | 'equal_to_opponent' | 'average';
    /** 是否可以超过最大HP */
    canExceedMax?: boolean;
}
/**
 * 同生共死效果 (HpEqual)
 *
 * 使双方的HP变为相同值。
 * 可以选择不同的计算模式。
 *
 * **功能：**
 * - equal_to_self: 对手HP变为自己的HP
 * - equal_to_opponent: 自己HP变为对手的HP
 * - average: 双方HP变为平均值
 * - 可选择是否能超过最大HP
 *
 * **使用场景：**
 *
 * 1. **同生共死技能（Effect_41）**
 *    - 对手HP变为自己的HP
 *    - 例如：自己50 HP，对手200 HP → 对手变为50 HP
 *
 * 2. **生命共享**
 *    - 双方HP变为平均值
 *    - 例如：自己50 HP，对手200 HP → 双方都变为125 HP
 *
 * 3. **生命转移**
 *    - 自己HP变为对手的HP
 *    - 例如：自己50 HP，对手200 HP → 自己变为200 HP
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "HpEqual",
 *   "timing": "AFTER_SKILL",
 *   "params": {
 *     "mode": "equal_to_self",
 *     "canExceedMax": false
 *   }
 * }
 * ```
 *
 * @category Special
 */
export declare class HpEqual extends BaseAtomicEffect {
    private mode;
    private canExceedMax;
    constructor(params: IHpEqualParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 最大HP修正效果参数接口
 */
export interface IMaxHpModifierParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'max_hp_modifier';
    /** 目标（self=自己，opponent=对手） */
    target: 'self' | 'opponent';
    /** 修正模式（multiply=倍率，add=加值，set=设置） */
    mode: 'multiply' | 'add' | 'set';
    /** 修正值 */
    value: number;
    /** 持续回合数（可选，默认永久） */
    duration?: number;
    /** 是否同时回复HP（可选，默认false） */
    healToNew?: boolean;
}
/**
 * 最大HP修正效果
 *
 * 功能：
 * - 修改目标的最大HP值
 * - 支持倍率、加值、设置三种模式
 * - 可设置持续回合数或永久生效
 * - 可选择是否同时回复HP到新的最大值
 *
 * 使用场景：
 * - 巨大化（最大HP翻倍）
 * - 虚弱（最大HP减半）
 * - HP强化（最大HP+100）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "max_hp_modifier",
 *   "target": "self",
 *   "mode": "multiply",
 *   "value": 2.0,
 *   "duration": 5,
 *   "healToNew": true
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   originalMaxHp: number;      // 原始最大HP
 *   modifiedMaxHp: number;      // 修正后最大HP
 *   remainingTurns?: number;    // 剩余回合数
 *   isModified: boolean;        // 是否已修正
 * }
 * ```
 */
export declare class MaxHpModifier extends BaseAtomicEffect {
    private target;
    private mode;
    private value;
    private duration?;
    private healToNew;
    constructor(params: IMaxHpModifierParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取修正状态
     */
    private getModifierState;
    /**
     * 设置修正状态
     */
    private setModifierState;
}
/**
 * 手下留情参数接口
 */
export interface IMercyParams {
    /** 保留的HP值 */
    remainingHp?: number;
    /** 是否总是生效 */
    alwaysActive?: boolean;
}
/**
 * 手下留情效果 (Mercy)
 *
 * 攻击不会导致对手HP降至0，至少保留1 HP。
 *
 * @category Special
 */
export declare class Mercy extends BaseAtomicEffect {
    private remainingHp;
    private alwaysActive;
    constructor(params: IMercyParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 随机HP削减参数接口
 */
export interface IRandomHpLossParams {
    /** 对方削减比例 */
    opponentRatio: number;
    /** 对方削减概率 */
    opponentChance: number;
    /** 自己削减比例 */
    selfRatio: number;
    /** 自己削减概率 */
    selfChance: number;
}
/**
 * 随机HP削减效果
 *
 * 随机削减对方或自己的HP
 *
 * @category Special
 * @example
 * // 随机HP削减
 * {
 *   opponentRatio: 0.5,
 *   opponentChance: 0.5,
 *   selfRatio: 0.5,
 *   selfChance: 0.5
 * }
 */
export declare class RandomHpLoss extends BaseAtomicEffect {
    private opponentRatio;
    private opponentChance;
    private selfRatio;
    private selfChance;
    constructor(params: IRandomHpLossParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=HpEffects.d.ts.map