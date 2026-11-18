/**
 * 效果优先级系统
 * 用于处理效果冲突和执行顺序
 */
import { IEffectResult } from './EffectContext';
/**
 * 效果优先级枚举
 */
export declare enum EffectPriority {
    HIGHEST = 1000,// 最高优先级（必中、必定暴击等）
    HIGH = 500,// 高优先级（伤害上限、伤害下限等）
    NORMAL = 0,// 普通优先级（大部分效果）
    LOW = -500,// 低优先级
    LOWEST = -1000
}
/**
 * 效果类型优先级映射
 */
export declare const EffectPriorityMap: Record<string, EffectPriority>;
/**
 * 互斥效果组
 * 同一组内的效果互斥，只能有一个生效
 */
export declare const MutuallyExclusiveGroups: Record<string, string[]>;
/**
 * 效果冲突解决器
 */
export declare class EffectConflictResolver {
    /**
     * 解决效果冲突
     *
     * @param results 效果结果数组
     * @returns 解决冲突后的效果结果数组
     */
    static ResolveConflicts(results: IEffectResult[]): IEffectResult[];
    /**
     * 按优先级排序效果
     */
    private static SortByPriority;
    /**
     * 移除互斥效果
     * 同一组内只保留优先级最高的效果
     */
    private static RemoveMutuallyExclusive;
    /**
     * 去除重复效果
     * 相同类型和目标的效果只保留第一个（优先级最高的）
     */
    private static DeduplicateEffects;
    /**
     * 检查效果类型是否允许重复
     */
    private static AllowsDuplicates;
    /**
     * 检查两个效果是否冲突
     */
    static IsConflicting(type1: string, type2: string): boolean;
}
//# sourceMappingURL=EffectPriority.d.ts.map