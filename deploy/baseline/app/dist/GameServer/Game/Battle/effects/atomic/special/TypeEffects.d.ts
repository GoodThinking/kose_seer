import { BaseAtomicEffect } from '../core/BaseAtomicEffect';
import { AtomicEffectType } from '../core/IAtomicEffect';
import { IEffectContext, IEffectResult } from '../../core/EffectContext';
/**
 * 属性复制效果参数接口
 */
export interface ITypeCopyParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'type_copy';
    /** 复制源（self=复制自己的属性给对手，opponent=复制对手的属性给自己） */
    source: 'self' | 'opponent';
    /** 持续回合数（可选，默认永久） */
    duration?: number;
    /** 是否覆盖原属性（true=覆盖，false=添加为第二属性） */
    overwrite?: boolean;
}
/**
 * 属性复制效果
 *
 * 功能：
 * - 复制自己或对手的属性
 * - 可以覆盖原属性或添加为第二属性
 * - 支持持续回合数或永久生效
 *
 * 使用场景：
 * - 属性模仿（复制对手属性）
 * - 属性传递（将自己属性复制给对手）
 * - 双属性（添加第二属性而不覆盖）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "type_copy",
 *   "source": "opponent",
 *   "duration": 5,
 *   "overwrite": true
 * }
 * ```
 *
 * 与TypeSwap的区别：
 * - TypeSwap: 交换双方属性（双向）
 * - TypeCopy: 复制属性（单向），可选择复制源和目标
 */
export declare class TypeCopy extends BaseAtomicEffect {
    private source;
    private duration?;
    private overwrite;
    constructor(params: ITypeCopyParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取精灵属性
     */
    private getPetType;
    /**
     * 设置精灵属性
     */
    private setPetType;
    /**
     * 添加第二属性
     */
    private addSecondaryType;
    /**
     * 移除第二属性
     */
    private removeSecondaryType;
    /**
     * 获取属性名称（简化版）
     */
    private getTypeName;
    /**
     * 获取复制状态
     */
    private getCopyState;
    /**
     * 设置复制状态
     */
    private setCopyState;
}
/**
 * 属性交换效果参数接口
 */
export interface ITypeSwapParams {
    type: AtomicEffectType.SPECIAL;
    specialType: 'type_swap';
    /** 持续回合数（可选，默认永久） */
    duration?: number;
    /** 是否交换双方属性（true=交换，false=仅复制对手属性） */
    swapBoth?: boolean;
}
/**
 * 属性交换效果
 *
 * 功能：
 * - 交换自己和对手的属性
 * - 可以设置持续回合数或永久生效
 * - 支持双向交换或单向复制
 *
 * 使用场景：
 * - 属性互换（交换双方属性）
 * - 属性复制（复制对手属性到自己）
 * - 临时属性变化（持续N回合）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "type_swap",
 *   "duration": 5,
 *   "swapBoth": true
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   originalType: number;       // 原始属性
 *   swappedType: number;        // 交换后的属性
 *   remainingTurns: number;     // 剩余回合数
 *   isSwapped: boolean;         // 是否已交换
 * }
 * ```
 */
export declare class TypeSwap extends BaseAtomicEffect {
    private duration?;
    private swapBoth;
    constructor(params: ITypeSwapParams);
    execute(context: IEffectContext): IEffectResult[];
    validate(params: any): boolean;
    /**
     * 获取精灵属性
     */
    private getPetType;
    /**
     * 设置精灵属性
     */
    private setPetType;
    /**
     * 获取交换状态
     */
    private getSwapState;
    /**
     * 设置交换状态
     */
    private setSwapState;
}
/**
 * 属性技能无效化参数接口
 */
export interface ITypeSkillNullifyParams {
    /** 持续回合数 */
    duration: number;
    /** 无效化的属性类型列表 */
    types: number[];
}
/**
 * 属性技能无效化效果
 *
 * 使特定属性的技能无效
 *
 * @category Special
 * @example
 * // 持续火属性技能无效
 * {
 *   duration: 5,
 *   types: [1] // 1 = 火属性
 * }
 */
export declare class TypeSkillNullify extends BaseAtomicEffect {
    private duration;
    private types;
    constructor(params: ITypeSkillNullifyParams);
    validate(params: any): boolean;
    execute(context: IEffectContext): IEffectResult[];
}
//# sourceMappingURL=TypeEffects.d.ts.map