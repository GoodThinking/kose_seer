"use strict";
/**
 * 效果优先级系统
 * 用于处理效果冲突和执行顺序
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EffectConflictResolver = exports.MutuallyExclusiveGroups = exports.EffectPriorityMap = exports.EffectPriority = void 0;
const utils_1 = require("../../../../../shared/utils");
/**
 * 效果优先级枚举
 */
var EffectPriority;
(function (EffectPriority) {
    EffectPriority[EffectPriority["HIGHEST"] = 1000] = "HIGHEST";
    EffectPriority[EffectPriority["HIGH"] = 500] = "HIGH";
    EffectPriority[EffectPriority["NORMAL"] = 0] = "NORMAL";
    EffectPriority[EffectPriority["LOW"] = -500] = "LOW";
    EffectPriority[EffectPriority["LOWEST"] = -1000] = "LOWEST"; // 最低优先级
})(EffectPriority || (exports.EffectPriority = EffectPriority = {}));
/**
 * 效果类型优先级映射
 */
exports.EffectPriorityMap = {
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
exports.MutuallyExclusiveGroups = {
    'crit_control': ['always_crit', 'no_crit'],
    'hit_control': ['never_miss', 'always_miss'],
    'damage_limit': ['damage_cap', 'damage_floor']
};
/**
 * 效果冲突解决器
 */
class EffectConflictResolver {
    /**
     * 解决效果冲突
     *
     * @param results 效果结果数组
     * @returns 解决冲突后的效果结果数组
     */
    static ResolveConflicts(results) {
        if (results.length === 0) {
            return results;
        }
        // 1. 按优先级排序
        const sorted = this.SortByPriority(results);
        // 2. 处理互斥效果
        const resolved = this.RemoveMutuallyExclusive(sorted);
        // 3. 处理重复效果
        const deduplicated = this.DeduplicateEffects(resolved);
        utils_1.Logger.Debug(`[EffectConflictResolver] 冲突解决: ` +
            `原始${results.length}个 → 排序后${sorted.length}个 → ` +
            `互斥处理后${resolved.length}个 → 去重后${deduplicated.length}个`);
        return deduplicated;
    }
    /**
     * 按优先级排序效果
     */
    static SortByPriority(results) {
        return results.sort((a, b) => {
            const priorityA = exports.EffectPriorityMap[a.type] || EffectPriority.NORMAL;
            const priorityB = exports.EffectPriorityMap[b.type] || EffectPriority.NORMAL;
            return priorityB - priorityA; // 降序排列（高优先级在前）
        });
    }
    /**
     * 移除互斥效果
     * 同一组内只保留优先级最高的效果
     */
    static RemoveMutuallyExclusive(results) {
        const resolved = [];
        const appliedGroups = new Map(); // 组名 -> 已应用的效果类型
        for (const result of results) {
            // 检查是否属于互斥组
            let isExclusive = false;
            let groupName = '';
            for (const [group, types] of Object.entries(exports.MutuallyExclusiveGroups)) {
                if (types.includes(result.type)) {
                    isExclusive = true;
                    groupName = group;
                    break;
                }
            }
            if (isExclusive) {
                // 检查该组是否已有效果
                if (appliedGroups.has(groupName)) {
                    utils_1.Logger.Debug(`[EffectConflictResolver] 互斥效果冲突: ${result.type} 被 ${appliedGroups.get(groupName)} 覆盖`);
                    continue; // 跳过该效果
                }
                else {
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
    static DeduplicateEffects(results) {
        const deduplicated = [];
        const seen = new Set();
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
            }
            else {
                utils_1.Logger.Debug(`[EffectConflictResolver] 重复效果: ${result.type} (target=${result.target})`);
            }
        }
        return deduplicated;
    }
    /**
     * 检查效果类型是否允许重复
     */
    static AllowsDuplicates(effectType) {
        const allowDuplicates = [
            'damage', // 多次伤害
            'heal', // 多次回复
            'multi_hit' // 连续攻击
        ];
        return allowDuplicates.includes(effectType);
    }
    /**
     * 检查两个效果是否冲突
     */
    static IsConflicting(type1, type2) {
        for (const types of Object.values(exports.MutuallyExclusiveGroups)) {
            if (types.includes(type1) && types.includes(type2)) {
                return true;
            }
        }
        return false;
    }
}
exports.EffectConflictResolver = EffectConflictResolver;
//# sourceMappingURL=EffectPriority.js.map