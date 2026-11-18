/**
 * 效果优先级系统
 * 用于处理效果冲突和执行顺序
 */

import { Logger } from '../../../../../shared/utils';
import { IEffectResult } from './EffectContext';

/**
 * 效果优先级枚举
 */
export enum EffectPriority {
  HIGHEST = 1000,   // 最高优先级（必中、必定暴击等）
  HIGH = 500,       // 高优先级（伤害上限、伤害下限等）
  NORMAL = 0,       // 普通优先级（大部分效果）
  LOW = -500,       // 低优先级
  LOWEST = -1000    // 最低优先级
}

/**
 * 效果类型优先级映射
 */
export const EffectPriorityMap: Record<string, EffectPriority> = {
  // 最高优先级：必定触发的效果
  'never_miss': EffectPriority.HIGHEST,
  'always_crit': EffectPriority.HIGHEST,
  'instant_ko': EffectPriority.HIGHEST,
  
  // 高优先级：影响判定的效果
  'no_crit': EffectPriority.HIGH,
  'damage_cap': EffectPriority.HIGH,
  'damage_floor': EffectPriority.HIGH,
  'fixed_damage_reduction': EffectPriority.HIGH,
  
  // 普通优先级：大部分效果
  'damage': EffectPriority.NORMAL,
  'heal': EffectPriority.NORMAL,
  'absorb': EffectPriority.NORMAL,
  'status': EffectPriority.NORMAL,
  'stat_change': EffectPriority.NORMAL,
  'recoil': EffectPriority.NORMAL,
  
  // 低优先级：次要效果
  'pp_reduce': EffectPriority.LOW,
  'encore': EffectPriority.LOW
};

/**
 * 互斥效果组
 * 同一组内的效果互斥，只能有一个生效
 */
export const MutuallyExclusiveGroups: Record<string, string[]> = {
  'crit_control': ['always_crit', 'no_crit'],
  'hit_control': ['never_miss', 'always_miss'],
  'damage_limit': ['damage_cap', 'damage_floor']
};

/**
 * 效果冲突解决器
 */
export class EffectConflictResolver {
  
  /**
   * 解决效果冲突
   * 
   * @param results 效果结果数组
   * @returns 解决冲突后的效果结果数组
   */
  public static ResolveConflicts(results: IEffectResult[]): IEffectResult[] {
    if (results.length === 0) {
      return results;
    }

    // 1. 按优先级排序
    const sorted = this.SortByPriority(results);

    // 2. 处理互斥效果
    const resolved = this.RemoveMutuallyExclusive(sorted);

    // 3. 处理重复效果
    const deduplicated = this.DeduplicateEffects(resolved);

    Logger.Debug(
      `[EffectConflictResolver] 冲突解决: ` +
      `原始${results.length}个 → 排序后${sorted.length}个 → ` +
      `互斥处理后${resolved.length}个 → 去重后${deduplicated.length}个`
    );

    return deduplicated;
  }

  /**
   * 按优先级排序效果
   */
  private static SortByPriority(results: IEffectResult[]): IEffectResult[] {
    return results.sort((a, b) => {
      const priorityA = EffectPriorityMap[a.type] || EffectPriority.NORMAL;
      const priorityB = EffectPriorityMap[b.type] || EffectPriority.NORMAL;
      return priorityB - priorityA; // 降序排列（高优先级在前）
    });
  }

  /**
   * 移除互斥效果
   * 同一组内只保留优先级最高的效果
   */
  private static RemoveMutuallyExclusive(results: IEffectResult[]): IEffectResult[] {
    const resolved: IEffectResult[] = [];
    const appliedGroups = new Map<string, string>(); // 组名 -> 已应用的效果类型

    for (const result of results) {
      // 检查是否属于互斥组
      let isExclusive = false;
      let groupName = '';

      for (const [group, types] of Object.entries(MutuallyExclusiveGroups)) {
        if (types.includes(result.type)) {
          isExclusive = true;
          groupName = group;
          break;
        }
      }

      if (isExclusive) {
        // 检查该组是否已有效果
        if (appliedGroups.has(groupName)) {
          Logger.Debug(
            `[EffectConflictResolver] 互斥效果冲突: ${result.type} 被 ${appliedGroups.get(groupName)} 覆盖`
          );
          continue; // 跳过该效果
        } else {
          appliedGroups.set(groupName, result.type);
        }
      }

      resolved.push(result);
    }

    return resolved;
  }

  /**
   * 去除重复效果
   * 相同类型和目标的效果只保留第一个（优先级最高的）
   */
  private static DeduplicateEffects(results: IEffectResult[]): IEffectResult[] {
    const deduplicated: IEffectResult[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      // 生成唯一键：类型 + 目标
      const key = `${result.type}_${result.target}`;

      // 特殊处理：某些效果允许重复（如多次伤害）
      if (this.AllowsDuplicates(result.type)) {
        deduplicated.push(result);
        continue;
      }

      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(result);
      } else {
        Logger.Debug(
          `[EffectConflictResolver] 重复效果: ${result.type} (target=${result.target})`
        );
      }
    }

    return deduplicated;
  }

  /**
   * 检查效果类型是否允许重复
   */
  private static AllowsDuplicates(effectType: string): boolean {
    const allowDuplicates = [
      'damage',      // 多次伤害
      'heal',        // 多次回复
      'multi_hit'    // 连续攻击
    ];
    return allowDuplicates.includes(effectType);
  }

  /**
   * 检查两个效果是否冲突
   */
  public static IsConflicting(type1: string, type2: string): boolean {
    for (const types of Object.values(MutuallyExclusiveGroups)) {
      if (types.includes(type1) && types.includes(type2)) {
        return true;
      }
    }
    return false;
  }
}
