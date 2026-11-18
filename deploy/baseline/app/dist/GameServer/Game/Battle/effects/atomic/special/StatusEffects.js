"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnHitConditionalStatus = exports.ConditionalStatusAura = exports.Flammable = exports.CumulativeStatus = exports.RandomStatusEffect = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const BattleModel_1 = require("../../../../../../shared/models/BattleModel");
/**
 * 随机异常状态效果
 *
 * 功能：
 * - 从指定的状态列表中随机选择一个施加给目标
 * - 支持概率触发
 *
 * 使用场景：
 * - 效果176: 30%概率随机异常状态（中毒、麻痹、冰冻、烧伤、睡眠、混乱）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "random_status",
 *   "target": "opponent",
 *   "statusList": [1, 2, 5, 6, 8, 0],
 *   "duration": 3,
 *   "probability": 30
 * }
 * ```
 *
 * 状态ID说明：
 * - 0: 混乱
 * - 1: 中毒
 * - 2: 麻痹
 * - 5: 冰冻
 * - 6: 烧伤
 * - 8: 睡眠
 */
class RandomStatusEffect extends BaseAtomicEffect_1.BaseAtomicEffect {
    target;
    statusList;
    duration;
    probability;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'RandomStatusEffect', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.target = params.target || 'opponent';
        this.statusList = params.statusList;
        this.duration = params.duration;
        this.probability = params.probability || 100;
    }
    execute(context) {
        const results = [];
        const target = this.target === 'self' ? this.getAttacker(context) : this.getDefender(context);
        // 概率判定
        if (Math.random() * 100 >= this.probability) {
            this.log(`随机异常状态未触发（概率${this.probability}%）`);
            return results;
        }
        // 随机选择一个状态
        const randomIndex = Math.floor(Math.random() * this.statusList.length);
        const statusId = this.statusList[randomIndex];
        // 检查是否已有异常状态
        if (target.status && target.status !== -1) {
            results.push(this.createResult(false, this.target === 'self' ? 'attacker' : 'defender', 'status_failed', `目标已有异常状态！`, 0));
            this.log(`随机异常状态失败: 目标已有状态${target.status}`);
            return results;
        }
        // 检查免疫
        if (target.immuneFlags?.status) {
            results.push(this.createResult(false, this.target === 'self' ? 'attacker' : 'defender', 'status_immune', `目标免疫异常状态！`, 0));
            this.log(`随机异常状态失败: 目标免疫`);
            return results;
        }
        // 施加状态
        if (__ubBlocked(target, statusId, context.attacker)) return [];
        target.status = statusId;
        if (!target.statusDurations) {
            target.statusDurations = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        }
        target.statusDurations[statusId] = this.duration;
        const statusNames = {
            0: '混乱',
            1: '中毒',
            2: '麻痹',
            5: '冰冻',
            6: '烧伤',
            8: '睡眠'
        };
        results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'status_inflict', `随机施加${statusNames[statusId] || '异常状态'}！`, statusId, { duration: this.duration }));
        this.log(`随机异常状态: 施加状态${statusId}(${statusNames[statusId]})，持续${this.duration}回合`);
        return results;
    }
    validate(params) {
        if (!params.statusList || params.statusList.length === 0) {
            this.log('statusList不能为空', 'error');
            return false;
        }
        if (params.duration === undefined || params.duration < 1) {
            this.log('duration必须大于0', 'error');
            return false;
        }
        return true;
    }
}
exports.RandomStatusEffect = RandomStatusEffect;
/**
 * 累积概率异常状态效果
 *
 * 每次使用时概率递增，直到达到最大值
 *
 * @category Special
 */
class CumulativeStatus extends BaseAtomicEffect_1.BaseAtomicEffect {
    baseProbability;
    probabilityIncrease;
    maxProbability;
    status;
    duration;
    // 追踪每个精灵的累积次数
    cumulativeCount = new Map();
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'CumulativeStatus', []);
        this.baseProbability = params.baseProbability || 30;
        this.probabilityIncrease = params.probabilityIncrease || 10;
        this.maxProbability = params.maxProbability || 100;
        this.status = params.status || 0;
        this.duration = params.duration || 3;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker, defender } = context;
        // 获取当前累积次数
        const count = this.cumulativeCount.get(attacker.id) || 0;
        // 计算当前概率
        const currentProbability = Math.min(this.baseProbability + count * this.probabilityIncrease, this.maxProbability);
        // 概率判定
        const roll = Math.random() * 100;
        const success = roll < currentProbability;
        if (success) {
            // 施加状态
            if (__ubBlocked(defender, this.status, attacker)) return [];
        defender.status = this.status;
            if (defender.statusDurations && this.status < defender.statusDurations.length) {
                defender.statusDurations[this.status] = this.duration;
            }
            // 增加累积次数
            this.cumulativeCount.set(attacker.id, count + 1);
            return [this.createResult(true, 'defender', 'cumulative_status', `累积概率异常状态触发（${currentProbability.toFixed(1)}%）`, this.status, {
                    status: this.status,
                    duration: this.duration,
                    probability: currentProbability,
                    cumulativeCount: count + 1,
                    success: true
                })];
        }
        else {
            // 增加累积次数（即使失败也增加）
            this.cumulativeCount.set(attacker.id, count + 1);
            return [this.createResult(false, 'defender', 'cumulative_status', `累积概率异常状态未触发（${currentProbability.toFixed(1)}%）`, 0, {
                    probability: currentProbability,
                    cumulativeCount: count + 1,
                    success: false
                })];
        }
    }
    /**
     * 重置累积计数（战斗结束或切换精灵时调用）
     */
    resetCount(attackerId) {
        this.cumulativeCount.delete(attackerId);
    }
}
exports.CumulativeStatus = CumulativeStatus;
/**
 * 易燃状态效果
 *
 * 命中后有概率令对方易燃
 * 易燃状态下受到火属性攻击伤害加倍
 *
 * @category Special
 * @example
 * // 概率易燃
 * {
 *   chance: 0.3,
 *   duration: 3
 * }
 */
class Flammable extends BaseAtomicEffect_1.BaseAtomicEffect {
    chance;
    duration;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Flammable', []);
        this.chance = params.chance;
        this.duration = params.duration;
    }
    validate(params) {
        return this.chance > 0 && this.chance <= 1 && this.duration > 0;
    }
    execute(context) {
        const { defender } = context;
        // 概率判定
        const roll = Math.random();
        if (roll > this.chance) {
            return [this.createResult(false, 'defender', 'flammable', `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`)];
        }
        // 施加易燃状态
        defender.status = BattleModel_1.BattleStatus.FLAMMABLE;
        defender.statusTurns = this.duration;
        // 更新状态持续时间数组
        if (!defender.statusDurations) {
            defender.statusDurations = new Array(20).fill(0);
        }
        defender.statusDurations[BattleModel_1.BattleStatus.FLAMMABLE] = this.duration;
        return [this.createResult(true, 'defender', 'flammable', `易燃状态（${this.duration}回合）`, this.duration, {
                status: BattleModel_1.BattleStatus.FLAMMABLE,
                duration: this.duration
            })];
    }
}
exports.Flammable = Flammable;
/**
 * 条件状态光环效果
 *
 * 满足特定条件时，持续有概率施加异常状态
 *
 * @category Special
 * @example
 * // 持续先手害怕
 * {
 *   duration: 5,
 *   status: BattleStatus.FEAR,
 *   statusDuration: 2,
 *   chance: 0.5,
 *   condition: 'first_strike'
 * }
 */
class ConditionalStatusAura extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    status;
    statusDuration;
    chance;
    condition;
    conditionValue;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'ConditionalStatusAura', []);
        this.duration = params.duration;
        this.status = params.status;
        this.statusDuration = params.statusDuration;
        this.chance = params.chance;
        this.condition = params.condition;
        this.conditionValue = params.conditionValue;
    }
    validate(params) {
        return this.duration > 0 && this.chance > 0 && this.chance <= 1;
    }
    execute(context) {
        const { attacker, defender } = context;
        // 检查条件是否满足
        const conditionMet = this.checkCondition(context);
        if (!conditionMet) {
            return [this.createResult(false, 'defender', 'conditional_status_aura', '条件不满足')];
        }
        // 概率判定
        const roll = Math.random();
        if (roll > this.chance) {
            return [this.createResult(false, 'defender', 'conditional_status_aura', `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`)];
        }
        // 施加状态
        if (__ubBlocked(defender, this.status, attacker)) return [];
        defender.status = this.status;
        defender.statusTurns = this.statusDuration;
        // 更新状态持续时间数组
        if (!defender.statusDurations) {
            defender.statusDurations = new Array(20).fill(0);
        }
        defender.statusDurations[this.status] = this.statusDuration;
        return [this.createResult(true, 'defender', 'conditional_status_aura', `条件状态施加（${BattleModel_1.BattleStatus[this.status]}，${this.statusDuration}回合）`, this.statusDuration, {
                status: this.status,
                statusDuration: this.statusDuration,
                condition: this.condition,
                duration: this.duration
            })];
    }
    checkCondition(context) {
        const { attacker, defender } = context;
        switch (this.condition) {
            case 'first_strike':
                // 检查是否先手（速度更快）
                return attacker.speed > defender.speed;
            case 'hp_below':
                // 检查HP是否低于指定百分比
                if (this.conditionValue) {
                    const hpPercent = attacker.hp / attacker.maxHp;
                    return hpPercent <= this.conditionValue;
                }
                return false;
            case 'stat_boosted':
                // 检查是否有能力提升
                if (attacker.battleLevels) {
                    return attacker.battleLevels.some(level => level > 0);
                }
                return false;
            default:
                return false;
        }
    }
}
exports.ConditionalStatusAura = ConditionalStatusAura;
/**
 * 受击条件状态效果
 *
 * 受到特定伤害时，有概率施加异常状态
 *
 * @category Special
 * @example
 * // 受高伤异常状态
 * {
 *   duration: 5,
 *   status: BattleStatus.BURN,
 *   statusDuration: 3,
 *   chance: 0.5,
 *   damageThreshold: 100
 * }
 */
class OnHitConditionalStatus extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    status;
    statusDuration;
    chance;
    damageThreshold;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'OnHitConditionalStatus', []);
        this.duration = params.duration;
        this.status = params.status;
        this.statusDuration = params.statusDuration;
        this.chance = params.chance;
        this.damageThreshold = params.damageThreshold;
    }
    validate(params) {
        return this.duration > 0 && this.chance > 0 && this.chance <= 1;
    }
    execute(context) {
        const { attacker, defender, damage } = context;
        // 检查伤害是否达到阈值
        if (!damage || damage < this.damageThreshold) {
            return [this.createResult(false, 'attacker', 'on_hit_conditional_status', `伤害未达到阈值（${damage || 0} < ${this.damageThreshold}）`)];
        }
        // 概率判定
        const roll = Math.random();
        if (roll > this.chance) {
            return [this.createResult(false, 'attacker', 'on_hit_conditional_status', `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`)];
        }
        // 施加状态到攻击者
        if (__ubBlocked(attacker, this.status, defender)) return [];
        attacker.status = this.status;
        attacker.statusTurns = this.statusDuration;
        // 更新状态持续时间数组
        if (!attacker.statusDurations) {
            attacker.statusDurations = new Array(20).fill(0);
        }
        attacker.statusDurations[this.status] = this.statusDuration;
        return [this.createResult(true, 'attacker', 'on_hit_conditional_status', `受击状态施加（${BattleModel_1.BattleStatus[this.status]}，${this.statusDuration}回合）`, this.statusDuration, {
                status: this.status,
                statusDuration: this.statusDuration,
                damageThreshold: this.damageThreshold,
                actualDamage: damage,
                duration: this.duration
            })];
    }
}
exports.OnHitConditionalStatus = OnHitConditionalStatus;
//# sourceMappingURL=StatusEffects.js.map
const __universeBudget = require('../../../UniverseBossBudget');
function __ubHeal(pet, amount, source, active = false) {
    const b = __universeBudget.battleFor(pet);
    if (b) return __universeBudget.heal(b, pet, amount, {active, source});
    const old = pet.hp;
    pet.hp = Math.min(pet.maxHp, pet.hp + amount);
    return pet.hp - old;
}
function __ubDamage(source, pet, amount, kind) {
    const b = __universeBudget.battleFor(pet);
    const actual = Math.min(pet.hp, __universeBudget.damage(b, source, pet, kind, amount));
    pet.hp = Math.max(0, pet.hp - actual);
    return actual;
}
function __ubReflect(attacker, defender, amount, source) {
    const b = __universeBudget.battleFor(defender) || __universeBudget.battleFor(attacker);
    if (b) return __universeBudget.reflect(b, attacker, defender, amount, source);
    const actual = Math.min(attacker.hp, amount);
    attacker.hp = Math.max(0, attacker.hp - actual);
    return actual;
}
function __ubBlocked(target, status, source) {
    const b = __universeBudget.battleFor(target);
    if (!b || target !== b.enemy) return false;
    source = source || b.universeBudgetState?.actor;
    if (source === target && status === 7) b.universeBudgetState.selfFatigue = true;
    return source !== target && [0, 6, 7, 8, 9, 15].includes(status) && __universeBudget.controlResistant(b);
}
function __ubFatal(target) {
    const b = __universeBudget.battleFor(target);
    return !!(b && target === b.enemy);
}
