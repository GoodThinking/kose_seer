"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IgnoreDefenseBuff = exports.StatBoostReversal = exports.StatBoostNullify = exports.CumulativeCritBoost = exports.ContinuousStatChange = exports.ContinuousMultiStatBoost = exports.ContinuousStatBoost = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
/**
 * 持续能力提升效果
 *
 * 每回合自动提升指定的多个能力
 *
 * @category Special
 */
class ContinuousStatBoost extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    stats;
    levelChange;
    target;
    // 追踪每个精灵的光环状态
    auras = new Map();
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'ContinuousStatBoost', []);
        this.duration = params.duration || 3;
        this.stats = params.stats || [0, 4]; // 默认：攻击和速度
        this.levelChange = params.levelChange || 1;
        this.target = params.target || 'self';
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker, defender } = context;
        const targetPet = this.target === 'self' ? attacker : defender;
        // 创建光环
        this.auras.set(targetPet.id, {
            duration: this.duration,
            remainingTurns: this.duration,
            stats: this.stats,
            levelChange: this.levelChange,
            target: this.target
        });
        return [this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'continuous_stat_boost', `持续${this.duration}回合能力提升光环`, this.duration, {
                duration: this.duration,
                stats: this.stats,
                levelChange: this.levelChange,
                target: this.target
            })];
    }
    /**
     * 每回合触发（在回合开始时调用）
     */
    onTurnStart(petId, pet) {
        const aura = this.auras.get(petId);
        if (!aura)
            return [];
        const results = [];
        // 提升能力
        for (const statIndex of aura.stats) {
            if (pet.statLevels && pet.statLevels[statIndex] !== undefined) {
                pet.statLevels[statIndex] += aura.levelChange;
                // 限制在[-6, 6]范围内
                pet.statLevels[statIndex] = Math.max(-6, Math.min(6, pet.statLevels[statIndex]));
            }
        }
        results.push(this.createResult(true, 'attacker', 'continuous_stat_boost_trigger', `持续能力提升触发`, aura.levelChange, {
            stats: aura.stats,
            levelChange: aura.levelChange,
            remainingTurns: aura.remainingTurns
        }));
        // 减少剩余回合数
        aura.remainingTurns--;
        if (aura.remainingTurns <= 0) {
            this.auras.delete(petId);
        }
        return results;
    }
    /**
     * 移除光环
     */
    removeAura(petId) {
        this.auras.delete(petId);
    }
    /**
     * 检查是否有光环
     */
    hasAura(petId) {
        return this.auras.has(petId);
    }
}
exports.ContinuousStatBoost = ContinuousStatBoost;
/**
 * 持续多能力变化效果
 *
 * 每回合自动修改多个能力（可以是提升或下降）
 *
 * @category Special
 */
class ContinuousMultiStatBoost extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    statChanges;
    target;
    // 追踪每个精灵的光环状态
    auras = new Map();
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'ContinuousMultiStatBoost', []);
        this.duration = params.duration || 3;
        this.statChanges = params.statChanges || [
            { stat: 0, change: -1 }, // 攻击-1
            { stat: 2, change: -1 } // 防御-1
        ];
        this.target = params.target || 'opponent';
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker, defender } = context;
        const targetPet = this.target === 'self' ? attacker : defender;
        // 创建光环
        this.auras.set(targetPet.id, {
            duration: this.duration,
            remainingTurns: this.duration,
            statChanges: this.statChanges,
            target: this.target
        });
        return [this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'continuous_multi_stat_boost', `持续${this.duration}回合多能力变化光环`, this.duration, {
                duration: this.duration,
                statChanges: this.statChanges,
                target: this.target
            })];
    }
    /**
     * 每回合触发（在回合开始时调用）
     */
    onTurnStart(petId, pet) {
        const aura = this.auras.get(petId);
        if (!aura)
            return [];
        const results = [];
        // 修改能力
        for (const { stat, change } of aura.statChanges) {
            if (pet.statLevels && pet.statLevels[stat] !== undefined) {
                pet.statLevels[stat] += change;
                // 限制在[-6, 6]范围内
                pet.statLevels[stat] = Math.max(-6, Math.min(6, pet.statLevels[stat]));
            }
        }
        results.push(this.createResult(true, 'attacker', 'continuous_multi_stat_boost_trigger', `持续多能力变化触发`, aura.statChanges.length, {
            statChanges: aura.statChanges,
            remainingTurns: aura.remainingTurns
        }));
        // 减少剩余回合数
        aura.remainingTurns--;
        if (aura.remainingTurns <= 0) {
            this.auras.delete(petId);
        }
        return results;
    }
    /**
     * 移除光环
     */
    removeAura(petId) {
        this.auras.delete(petId);
    }
    /**
     * 检查是否有光环
     */
    hasAura(petId) {
        return this.auras.has(petId);
    }
}
exports.ContinuousMultiStatBoost = ContinuousMultiStatBoost;
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
class ContinuousStatChange extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    statChanges;
    timing;
    target;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'ContinuousStatChange', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.TURN_START, EffectContext_1.EffectTiming.TURN_END]);
        this.duration = params.duration;
        this.statChanges = params.statChanges;
        this.timing = params.timing || 'TURN_START';
        this.target = params.target || 'opponent';
    }
    execute(context) {
        const results = [];
        const target = this.target === 'self' ? this.getAttacker(context) : this.getDefender(context);
        // 在AFTER_SKILL时机设置效果
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            if (!target.effectCounters) {
                target.effectCounters = {};
            }
            // 存储持续效果信息（使用特殊命名的计数器）
            target.effectCounters['continuous_stat_change'] = this.duration;
            // 将每个能力变化存储为独立的计数器
            for (let i = 0; i < this.statChanges.length; i++) {
                const change = this.statChanges[i];
                target.effectCounters[`continuous_stat_${i}_stat`] = change.stat;
                target.effectCounters[`continuous_stat_${i}_change`] = change.change;
            }
            target.effectCounters['continuous_stat_count'] = this.statChanges.length;
            target.effectCounters['continuous_stat_timing'] = this.timing === 'TURN_START' ? 1 : 2;
            results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'continuous_stat_change', `持续能力变化状态！持续${this.duration}回合`, this.duration, { statChanges: this.statChanges }));
            this.log(`持续能力变化: ${this.statChanges.length}个能力, 持续${this.duration}回合`);
        }
        // 在指定时机触发能力变化
        const shouldTrigger = (this.timing === 'TURN_START' && context.timing === EffectContext_1.EffectTiming.TURN_START) ||
            (this.timing === 'TURN_END' && context.timing === EffectContext_1.EffectTiming.TURN_END);
        if (shouldTrigger && target.effectCounters?.['continuous_stat_change']) {
            const count = target.effectCounters['continuous_stat_count'] || 0;
            if (count > 0) {
                // 重建能力变化列表
                const statChanges = [];
                for (let i = 0; i < count; i++) {
                    const stat = target.effectCounters[`continuous_stat_${i}_stat`] || 0;
                    const change = target.effectCounters[`continuous_stat_${i}_change`] || 0;
                    statChanges.push({ stat, change });
                }
                // 初始化battleLv
                if (!target.battleLv) {
                    target.battleLv = [0, 0, 0, 0, 0, 0];
                }
                // 应用能力变化
                for (const change of statChanges) {
                    const oldLevel = target.battleLv[change.stat];
                    target.battleLv[change.stat] = Math.max(-6, Math.min(6, oldLevel + change.change));
                    results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'stat_change', `能力${change.stat}变化${change.change > 0 ? '+' : ''}${change.change}！`, change.change, { statIndex: change.stat, oldLevel, newLevel: target.battleLv[change.stat] }));
                    this.log(`持续能力变化触发: 能力${change.stat} ${oldLevel} -> ${target.battleLv[change.stat]}`);
                }
                // 递减计数器
                target.effectCounters['continuous_stat_change']--;
                if (target.effectCounters['continuous_stat_change'] <= 0) {
                    delete target.effectCounters['continuous_stat_change'];
                    const count = target.effectCounters['continuous_stat_count'] || 0;
                    for (let i = 0; i < count; i++) {
                        delete target.effectCounters[`continuous_stat_${i}_stat`];
                        delete target.effectCounters[`continuous_stat_${i}_change`];
                    }
                    delete target.effectCounters['continuous_stat_count'];
                    delete target.effectCounters['continuous_stat_timing'];
                    results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'continuous_stat_change_end', `持续能力变化状态解除！`, 0));
                    this.log(`持续能力变化状态解除`);
                }
            }
        }
        return results;
    }
    validate(params) {
        if (params.duration === undefined || params.duration < 1) {
            this.log('duration必须大于0', 'error');
            return false;
        }
        if (!params.statChanges || params.statChanges.length === 0) {
            this.log('statChanges不能为空', 'error');
            return false;
        }
        return true;
    }
}
exports.ContinuousStatChange = ContinuousStatChange;
/**
 * 累积暴击率提升效果
 *
 * 每次攻击后暴击率递增，直到达到最大值
 *
 * @category Special
 */
class CumulativeCritBoost extends BaseAtomicEffect_1.BaseAtomicEffect {
    critIncrease;
    maxCritIncrease;
    // 追踪每个精灵的累积暴击率
    cumulativeCrit = new Map();
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'CumulativeCritBoost', []);
        this.critIncrease = params.critIncrease || 6.25;
        this.maxCritIncrease = params.maxCritIncrease || 50;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker } = context;
        // 获取当前累积暴击率
        const currentCrit = this.cumulativeCrit.get(attacker.id) || 0;
        // 计算新的暴击率
        const newCrit = Math.min(currentCrit + this.critIncrease, this.maxCritIncrease);
        // 更新累积暴击率
        this.cumulativeCrit.set(attacker.id, newCrit);
        // 应用暴击率提升
        if (context.critRate !== undefined) {
            context.critRate += newCrit;
        }
        return [this.createResult(true, 'attacker', 'cumulative_crit_boost', `累积暴击率提升 +${newCrit.toFixed(2)}%`, newCrit, {
                critIncrease: this.critIncrease,
                currentCrit: newCrit,
                maxCrit: this.maxCritIncrease,
                isMaxed: newCrit >= this.maxCritIncrease
            })];
    }
    /**
     * 重置累积暴击率（战斗结束或切换精灵时调用）
     */
    resetCrit(attackerId) {
        this.cumulativeCrit.delete(attackerId);
    }
    /**
     * 获取当前累积暴击率
     */
    getCurrentCrit(attackerId) {
        return this.cumulativeCrit.get(attackerId) || 0;
    }
}
exports.CumulativeCritBoost = CumulativeCritBoost;
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
class StatBoostNullify extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    target;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'StatBoostNullify', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.TURN_END]);
        this.duration = params.duration;
        this.target = params.target || 'opponent';
    }
    execute(context) {
        const results = [];
        const target = this.target === 'self' ? this.getAttacker(context) : this.getDefender(context);
        // 在AFTER_SKILL时机设置效果
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            if (!target.effectCounters) {
                target.effectCounters = {};
            }
            target.effectCounters['stat_boost_nullify'] = this.duration;
            results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'stat_boost_nullify', `能力增强失效状态！持续${this.duration}回合`, this.duration));
            this.log(`能力增强失效: 持续${this.duration}回合`);
        }
        // 在TURN_END时机递减计数器
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            if (target.effectCounters?.['stat_boost_nullify']) {
                target.effectCounters['stat_boost_nullify']--;
                if (target.effectCounters['stat_boost_nullify'] <= 0) {
                    delete target.effectCounters['stat_boost_nullify'];
                    results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'stat_boost_nullify_end', `能力增强失效状态解除！`, 0));
                    this.log(`能力增强失效状态解除`);
                }
            }
        }
        return results;
    }
    validate(params) {
        if (params.duration === undefined || params.duration < 1) {
            this.log('duration必须大于0', 'error');
            return false;
        }
        return true;
    }
}
exports.StatBoostNullify = StatBoostNullify;
/**
 * 能力提升反转效果
 *
 * 将目标的所有能力提升变为能力下降
 *
 * @category Special
 */
class StatBoostReversal extends BaseAtomicEffect_1.BaseAtomicEffect {
    target;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'StatBoostReversal', []);
        this.target = params.target || 'opponent';
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker, defender } = context;
        const targetPet = this.target === 'self' ? attacker : defender;
        let reversedCount = 0;
        // 反转所有能力提升
        if (targetPet.battleLevels) {
            for (let i = 0; i < targetPet.battleLevels.length; i++) {
                if (targetPet.battleLevels[i] > 0) {
                    targetPet.battleLevels[i] = -targetPet.battleLevels[i];
                    reversedCount++;
                }
            }
        }
        return [this.createResult(reversedCount > 0, this.target === 'self' ? 'attacker' : 'defender', 'stat_boost_reversal', `能力提升反转（${reversedCount}个能力）`, reversedCount, {
                target: this.target,
                reversedCount
            })];
    }
}
exports.StatBoostReversal = StatBoostReversal;
/**
 * 无视防御能力提升效果
 *
 * 伤害计算时忽略对手的防御/特防能力提升
 *
 * @category Special
 */
class IgnoreDefenseBuff extends BaseAtomicEffect_1.BaseAtomicEffect {
    ignoreSpDefense;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'IgnoreDefenseBuff', []);
        this.ignoreSpDefense = params.ignoreSpDefense !== false;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { defender } = context;
        // 简化实现：标记忽略防御buff
        // 实际的忽略逻辑需要在伤害计算中实现
        let ignoredStats = [];
        // 检查防御能力提升
        if (defender.battleLevels) {
            // 物理防御（index 1）
            if (defender.battleLevels[1] > 0) {
                ignoredStats.push(1);
            }
            // 特殊防御（index 3）
            if (this.ignoreSpDefense && defender.battleLevels[3] > 0) {
                ignoredStats.push(3);
            }
        }
        return [this.createResult(ignoredStats.length > 0, 'attacker', 'ignore_defense_buff', `无视防御能力提升`, ignoredStats.length, {
                ignoredStats,
                ignoreSpDefense: this.ignoreSpDefense
            })];
    }
}
exports.IgnoreDefenseBuff = IgnoreDefenseBuff;
//# sourceMappingURL=StatEffects.js.map