import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
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
export declare class Sacrifice extends BaseAtomicEffect {
    private mode;
    private value;
    private powerBonus;
    private damageAfterKo;
    constructor(params: ISacrificeParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class SacrificeCrit extends BaseAtomicEffect {
    private mode;
    private hpCost;
    private critBoost;
    private guaranteedCrit;
    constructor(params: ISacrificeCritParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
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
export declare class SacrificeDamage extends BaseAtomicEffect {
    private minDamage;
    private maxDamage;
    private leaveOneHp;
    constructor(params: ISacrificeDamageParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=SacrificeEffects.d.ts.map