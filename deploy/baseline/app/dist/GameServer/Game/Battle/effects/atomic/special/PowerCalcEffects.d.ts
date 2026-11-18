import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 惩罚效果参数接口
 */
export interface IPunishmentParams {
    /** 惩罚类型 */
    type: 'stat_boost' | 'status' | 'hp_percent';
    /** 惩罚倍率（每个能力提升/状态增加的伤害倍率） */
    multiplier: number;
    /** 基础威力 */
    basePower?: number;
}
/**
 * 惩罚效果 (Punishment)
 *
 * 根据对手的状态（能力提升、异常状态、HP百分比等）增加伤害。
 * 对手状态越好/越差，伤害越高。
 *
 * **功能：**
 * - stat_boost: 对手能力提升越多，伤害越高
 * - status: 对手异常状态越多，伤害越高
 * - hp_percent: 对手HP越高，伤害越高
 *
 * **使用场景：**
 *
 * 1. **惩罚强化（Effect_35）**
 *    - 对手每有1级能力提升，伤害+20
 *    - 例如：对手攻击+2、速度+1，伤害 = 基础 + 60
 *
 * 2. **惩罚异常状态**
 *    - 对手每有1个异常状态，伤害+30%
 *    - 例如：对手中毒+灼伤，伤害 = 基础 × 1.6
 *
 * 3. **惩罚高HP**
 *    - 对手HP越高，伤害越高
 *    - 例如：对手HP 100%时，伤害 = 基础 × 2.0
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Punishment",
 *   "timing": "BEFORE_DAMAGE_CALC",
 *   "params": {
 *     "type": "stat_boost",
 *     "multiplier": 20,
 *     "basePower": 60
 *   }
 * }
 * ```
 *
 * @category Special
 */
export declare class Punishment extends BaseAtomicEffect {
    private punishmentType;
    private multiplier;
    private basePower;
    constructor(params: IPunishmentParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 反转效果参数接口
 */
export interface IReversalParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'reversal';
    /** 反转类型：hp_ratio=HP比例, stat_changes=能力变化 */
    reversalType: 'hp_ratio' | 'stat_changes';
    /** 威力基础值 */
    basePower?: number;
    /** 最大威力 */
    maxPower?: number;
}
/**
 * 反转效果
 *
 * 功能：
 * - HP比例反转：HP越低威力越高
 * - 能力变化反转：将能力提升变为降低，降低变为提升
 * - 可设置威力基础值和最大值
 * - 动态计算威力
 *
 * 使用场景：
 * - 绝地反击（HP越低威力越高，最高200）
 * - 反转世界（交换所有能力变化的正负）
 * - 背水一战（HP低于25%时威力翻倍）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "reversal",
 *   "reversalType": "hp_ratio",
 *   "basePower": 20,
 *   "maxPower": 200
 * }
 * ```
 *
 * HP比例反转计算公式：
 * - 威力 = basePower + (maxPower - basePower) × (1 - HP百分比)
 * - 例如：HP 10%时，威力 = 20 + (200 - 20) × 0.9 = 182
 */
export declare class Reversal extends BaseAtomicEffect {
    private reversalType;
    private basePower;
    private maxPower;
    constructor(params: IReversalParams);
    execute(context: IEffectContext): IEffectResult[];
    /**
     * 应用HP比例反转
     */
    private applyHpRatioReversal;
    /**
     * 应用能力变化反转
     */
    private applyStatChangesReversal;
    validate(params: any): boolean;
}
/**
 * 个体威力提升参数接口
 */
export interface IIvPowerParams {
    /** 最小威力 */
    minPower: number;
    /** 最大威力 */
    maxPower: number;
    /** IV计算方式 */
    ivType: 'total' | 'average' | 'max';
}
/**
 * 个体威力提升效果
 *
 * 根据个体值提升威力
 *
 * @category Special
 * @example
 * // 个体威力提升
 * {
 *   minPower: 1,
 *   maxPower: 155,
 *   ivType: 'total'
 * }
 */
export declare class IvPower extends BaseAtomicEffect {
    private minPower;
    private maxPower;
    private ivType;
    constructor(params: IIvPowerParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
    private calculateIv;
}
/**
 * 加权随机威力参数接口
 */
export interface IWeightedRandomPowerParams {
    /** 威力范围列表 */
    powerRanges: Array<{
        min: number;
        max: number;
        weight: number;
    }>;
}
/**
 * 加权随机威力效果
 *
 * 按权重随机选择威力范围
 *
 * @category Special
 * @example
 * // 多段随机威力
 * {
 *   powerRanges: [
 *     { min: 301, max: 350, weight: 0.5 },
 *     { min: 101, max: 300, weight: 0.3 },
 *     { min: 5, max: 100, weight: 0.2 }
 *   ]
 * }
 */
export declare class WeightedRandomPower extends BaseAtomicEffect {
    private powerRanges;
    constructor(params: IWeightedRandomPowerParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 等级伤害附加参数接口
 */
export interface ILevelDamageParams {
    /** 等级伤害系数 */
    levelMultiplier?: number;
}
/**
 * 等级伤害附加效果
 *
 * 根据自身等级计算额外伤害
 *
 * @category Special
 */
export declare class LevelDamage extends BaseAtomicEffect {
    private levelMultiplier;
    constructor(params: ILevelDamageParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
/**
 * 反作用力参数接口
 */
export interface IRecoilParams {
    /** 反作用力模式 */
    mode: 'damage_percent' | 'max_hp_percent' | 'fixed';
    /** 反作用力比例/数值 */
    value: number;
    /** 是否可以导致自己昏厥 */
    canKo?: boolean;
}
/**
 * 反作用力效果 (Recoil)
 *
 * 使用技能后，自己受到反作用力伤害。
 * 伤害可以基于造成的伤害、最大HP或固定值。
 *
 * **功能：**
 * - damage_percent: 基于造成伤害的百分比
 * - max_hp_percent: 基于自己最大HP的百分比
 * - fixed: 固定伤害
 * - 可选择是否能导致自己昏厥
 *
 * **使用场景：**
 *
 * 1. **猛撞类技能（Effect_11）**
 *    - 造成伤害的1/4反作用力
 *    - 例如：造成100伤害，自己受到25伤害
 *
 * 2. **舍身冲撞**
 *    - 造成伤害的1/3反作用力
 *    - 例如：造成120伤害，自己受到40伤害
 *
 * 3. **爆炸类技能**
 *    - 自己最大HP的50%反作用力
 *    - 可以导致自己昏厥
 *
 * 4. **心灵冲击**
 *    - 固定50点反作用力
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Recoil",
 *   "timing": "AFTER_SKILL",
 *   "params": {
 *     "mode": "damage_percent",
 *     "value": 0.25,
 *     "canKo": false
 *   }
 * }
 * ```
 *
 * @category Special
 */
export declare class Recoil extends BaseAtomicEffect {
    private mode;
    private value;
    private canKo;
    constructor(params: IRecoilParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=PowerCalcEffects.d.ts.map