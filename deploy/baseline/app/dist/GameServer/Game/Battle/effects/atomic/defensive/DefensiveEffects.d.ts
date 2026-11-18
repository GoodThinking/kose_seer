import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 反击效果参数接口
 */
export interface ICounterParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'counter';
    reflectRatio: number;
    reflectFixed?: number;
    duration: number;
    minTurns?: number;
    maxTurns?: number;
    counterType?: 'all' | 'physical' | 'special';
}
/**
 * 反击原子效果
 * 在X~Y回合内，将自身受到的伤害按比例反弹给对方
 *
 * 用途：
 * - Effect_21: 持续反弹伤害（3-5回合，反弹50%）
 * - Effect_462: 固定值反弹
 *
 * 特性：
 * - 支持比例反弹和固定值反弹
 * - 支持随机持续回合数
 * - 可以指定反击类型（物理/特殊/全部）
 *
 * @example
 * // 3-5回合内反弹50%伤害
 * {
 *   type: 'special',
 *   specialType: 'counter',
 *   reflectRatio: 0.5,
 *   duration: 0,
 *   minTurns: 3,
 *   maxTurns: 5,
 *   counterType: 'all'
 * }
 *
 * @example
 * // 固定反弹100点伤害，持续3回合
 * {
 *   type: 'special',
 *   specialType: 'counter',
 *   reflectFixed: 100,
 *   duration: 3,
 *   counterType: 'physical'
 * }
 *
 * @category Defensive
 */
export declare class Counter extends BaseAtomicEffect {
    private params;
    constructor(params: ICounterParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取实际持续回合数
     */
    getDuration(): number;
}
/**
 * 伤害护盾参数接口
 */
export interface IDamageShieldParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'damage_shield';
    reductionRatio?: number;
    reductionFixed?: number;
    duration: number;
    shieldType?: 'all' | 'physical' | 'special';
    maxReduction?: number;
}
/**
 * 伤害护盾原子效果
 * 在X回合内减少特定类型的伤害
 *
 * 用途：
 * - Effect_50: 持续物理伤害减免（5回合，减免50%）
 * - Effect_54: 持续降低对方伤害
 * - Effect_125: 伤害上限
 *
 * 特性：
 * - 支持比例减免和固定值减免
 * - 可以指定护盾类型（物理/特殊/全部）
 * - 可以设置最大减免值
 *
 * @example
 * // 5回合内物理伤害减免50%
 * {
 *   type: 'special',
 *   specialType: 'damage_shield',
 *   reductionRatio: 0.5,
 *   duration: 5,
 *   shieldType: 'physical'
 * }
 *
 * @example
 * // 3回合内每次受到的伤害不超过100
 * {
 *   type: 'special',
 *   specialType: 'damage_shield',
 *   duration: 3,
 *   maxReduction: 100,
 *   shieldType: 'all'
 * }
 *
 * @category Defensive
 */
export declare class DamageShield extends BaseAtomicEffect {
    private params;
    constructor(params: IDamageShieldParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取护盾类型名称
     */
    private getShieldTypeName;
}
/**
 * 忍耐效果参数接口
 */
export interface IEndureParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'endure';
    duration: number;
    minHp?: number;
    probability?: number;
    oncePerBattle?: boolean;
}
/**
 * 忍耐原子效果
 * 在X回合内，受到致死攻击时保留1点HP
 *
 * 用途：
 * - Effect_68: 保留1血（3回合内必定触发一次）
 *
 * 特性：
 * - 防止被一击秒杀
 * - 可以设置保留的最小HP
 * - 可以设置触发概率
 * - 可以限制每场战斗只触发一次
 *
 * @example
 * // 3回合内受到致死攻击时保留1HP
 * {
 *   type: 'special',
 *   specialType: 'endure',
 *   duration: 3,
 *   minHp: 1,
 *   oncePerBattle: true
 * }
 *
 * @example
 * // 5回合内50%概率保留5HP
 * {
 *   type: 'special',
 *   specialType: 'endure',
 *   duration: 5,
 *   minHp: 5,
 *   probability: 50
 * }
 *
 * @category Defensive
 */
export declare class Endure extends BaseAtomicEffect {
    private params;
    private static triggeredInBattle;
    constructor(params: IEndureParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 重置战斗触发记录（新战斗开始时调用）
     */
    static ResetBattleTriggers(): void;
    /**
     * 检查精灵是否已触发过忍耐
     */
    static HasTriggered(petId: number): boolean;
}
export interface IImmuneParams {
    type: AtomicEffectType.IMMUNE;
    target: 'self' | 'opponent';
    immuneType: 'damage' | 'status' | 'stat_change';
}
/**
 * 免疫效果原子效果
 * 使目标免疫特定类型的效果
 */
export declare class ImmuneEffect extends BaseAtomicEffect {
    private params;
    constructor(params: IImmuneParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
export interface IReflectParams {
    type: AtomicEffectType.REFLECT;
    reflectRatio: number;
}
/**
 * 反弹效果原子效果
 * 将受到的伤害按比例反弹给攻击者
 */
export declare class ReflectEffect extends BaseAtomicEffect {
    private params;
    constructor(params: IReflectParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
//# sourceMappingURL=DefensiveEffects.d.ts.map