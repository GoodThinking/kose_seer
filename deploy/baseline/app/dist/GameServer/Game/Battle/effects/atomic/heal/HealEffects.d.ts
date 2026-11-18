import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType, IHealParams } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 回复效果原子效果
 * 回复目标的HP
 *
 * @example
 * // 回复自身最大HP的50%
 * { type: 'heal', target: 'self', mode: 'percent', value: 0.5 }
 *
 * // 回复固定100点HP
 * { type: 'heal', target: 'self', mode: 'fixed', value: 100 }
 *
 * // 回复造成伤害的50%
 * { type: 'heal', target: 'self', mode: 'damage_percent', value: 0.5 }
 */
export declare class HealEffect extends BaseAtomicEffect {
    private params;
    constructor(params: IHealParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
/**
 * 回复反转效果参数接口
 */
export interface IHealReversalParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'heal_reversal';
    /** 持续回合数（可选，默认永久） */
    duration?: number;
    /** 是否同时反转吸血效果（可选，默认true） */
    reverseDrain?: boolean;
}
/**
 * 回复反转效果
 *
 * 功能：
 * - 将回复效果转换为伤害
 * - 可设置持续回合数或永久生效
 * - 可选择是否反转吸血效果
 *
 * 使用场景：
 * - 治疗封印（回复变成伤害）
 * - 诅咒状态（无法回复HP）
 * - 反转领域（所有回复效果反转）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "heal_reversal",
 *   "duration": 5,
 *   "reverseDrain": true
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   remainingTurns?: number;    // 剩余回合数
 *   isActive: boolean;          // 是否激活
 *   reverseDrain: boolean;      // 是否反转吸血
 * }
 * ```
 */
export declare class HealReversal extends BaseAtomicEffect {
    private duration?;
    private reverseDrain;
    constructor(params: IHealReversalParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取反转状态
     */
    private getReversalState;
}
/**
 * 持续回复参数接口
 */
export interface IRegenerationParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'regeneration';
    target: 'self' | 'opponent';
    duration: number;
    healRatio?: number;
    healAmount?: number;
}
/**
 * 持续回复原子效果
 * 每回合回复一定比例或固定值的HP
 *
 * @example
 * // 每回合回复最大HP的1/16，持续5回合
 * { type: 'special', specialType: 'regeneration', target: 'self', duration: 5, healRatio: 0.0625 }
 *
 * // 每回合回复50HP，持续3回合
 * { type: 'special', specialType: 'regeneration', target: 'self', duration: 3, healAmount: 50 }
 */
export declare class Regeneration extends BaseAtomicEffect {
    private params;
    constructor(params: IRegenerationParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
}
//# sourceMappingURL=HealEffects.d.ts.map