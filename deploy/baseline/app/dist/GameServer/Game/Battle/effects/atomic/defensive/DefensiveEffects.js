"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReflectEffect = exports.ImmuneEffect = exports.Endure = exports.DamageShield = exports.Counter = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
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
class Counter extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Counter', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const attacker = context.attacker;
        const defender = context.defender;
        const damage = context.damage;
        // 检查是否有伤害
        if (damage <= 0) {
            return results;
        }
        // 检查反击类型
        if (this.params.counterType) {
            const skillCategory = context.skillCategory;
            if (this.params.counterType === 'physical' && skillCategory !== 1) {
                return results;
            }
            if (this.params.counterType === 'special' && skillCategory !== 2) {
                return results;
            }
        }
        // 计算反弹伤害
        let counterDamage = 0;
        if (this.params.reflectFixed !== undefined) {
            // 固定值反弹
            counterDamage = this.params.reflectFixed;
        }
        else {
            // 比例反弹
            counterDamage = Math.floor(damage * this.params.reflectRatio);
        }
        // 确保反弹伤害至少为1
        counterDamage = Math.max(1, counterDamage);
        // 对攻击者造成反弹伤害
        const actualCounterDamage = Math.min(counterDamage, attacker.hp);
        if (actualCounterDamage > 0) {
            if (__universeBudget.battleFor(attacker)) { __ubReflect(attacker, defender, actualCounterDamage, 'atomic-counter'); } else { attacker.hp -= actualCounterDamage; }
            results.push(this.createResult(true, 'attacker', 'counter_damage', `受到${__universeBudget.battleFor(context.attacker) ? "待结算" : actualCounterDamage}点反击伤害`, actualCounterDamage, { originalDamage: damage, counterDamage: actualCounterDamage }));
            this.log(`反击: 受到${damage}伤害, 反弹${__universeBudget.battleFor(context.attacker) ? "待结算" : actualCounterDamage}伤害`);
        }
        return results;
    }
    validate(params) {
        if (!params || params.type !== IAtomicEffect_1.AtomicEffectType.SPECIAL || params.specialType !== 'counter') {
            return false;
        }
        // 必须有reflectRatio或reflectFixed之一
        const hasRatio = typeof params.reflectRatio === 'number';
        const hasFixed = typeof params.reflectFixed === 'number';
        if (!hasRatio && !hasFixed) {
            return false;
        }
        // 如果有随机范围，检查范围有效性
        if (params.minTurns !== undefined && params.maxTurns !== undefined) {
            if (params.minTurns > params.maxTurns || params.minTurns < 1) {
                return false;
            }
        }
        else if (typeof params.duration !== 'number' || params.duration < 1) {
            return false;
        }
        return true;
    }
    /**
     * 获取实际持续回合数
     */
    getDuration() {
        if (this.params.minTurns !== undefined && this.params.maxTurns !== undefined) {
            const range = this.params.maxTurns - this.params.minTurns + 1;
            return this.params.minTurns + Math.floor(Math.random() * range);
        }
        return this.params.duration;
    }
}
exports.Counter = Counter;
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
class DamageShield extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Damage Shield', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const originalDamage = context.damage;
        // 检查伤害是否为0
        if (originalDamage <= 0) {
            return results;
        }
        // 检查护盾类型
        if (this.params.shieldType) {
            const skillCategory = context.skillCategory;
            if (this.params.shieldType === 'physical' && skillCategory !== 1) {
                return results;
            }
            if (this.params.shieldType === 'special' && skillCategory !== 2) {
                return results;
            }
        }
        let newDamage = originalDamage;
        let reductionAmount = 0;
        // 计算减免
        if (this.params.reductionFixed !== undefined) {
            // 固定值减免
            reductionAmount = this.params.reductionFixed;
            newDamage = Math.max(1, originalDamage - reductionAmount);
        }
        else if (this.params.reductionRatio !== undefined) {
            // 比例减免
            reductionAmount = Math.floor(originalDamage * this.params.reductionRatio);
            newDamage = Math.max(1, originalDamage - reductionAmount);
        }
        // 应用最大减免限制
        if (this.params.maxReduction !== undefined) {
            if (originalDamage > this.params.maxReduction) {
                newDamage = this.params.maxReduction;
                reductionAmount = originalDamage - newDamage;
            }
        }
        // 更新伤害值
        if (newDamage !== originalDamage) {
            context.damage = newDamage;
            const shieldTypeName = this.getShieldTypeName(this.params.shieldType);
            results.push(this.createResult(true, 'defender', 'damage_shield', `${shieldTypeName}护盾减免${reductionAmount}点伤害`, reductionAmount, { originalDamage, newDamage, reductionAmount }));
            this.log(`伤害护盾: ${originalDamage} -> ${newDamage} (减免${reductionAmount})`);
        }
        return results;
    }
    validate(params) {
        if (!params || params.type !== IAtomicEffect_1.AtomicEffectType.SPECIAL || params.specialType !== 'damage_shield') {
            return false;
        }
        if (typeof params.duration !== 'number' || params.duration < 1) {
            return false;
        }
        // 必须有reductionRatio、reductionFixed或maxReduction之一
        const hasRatio = typeof params.reductionRatio === 'number';
        const hasFixed = typeof params.reductionFixed === 'number';
        const hasMax = typeof params.maxReduction === 'number';
        return hasRatio || hasFixed || hasMax;
    }
    /**
     * 获取护盾类型名称
     */
    getShieldTypeName(type) {
        switch (type) {
            case 'physical': return '物理';
            case 'special': return '特殊';
            case 'all':
            default: return '全';
        }
    }
}
exports.DamageShield = DamageShield;
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
class Endure extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    static triggeredInBattle = new Set();
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Endure', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const defender = context.defender;
        const damage = context.damage;
        // 检查是否会被击败
        const wouldBeFatal = defender.hp - damage <= 0;
        if (!wouldBeFatal) {
            return results;
        }
        // 检查是否已经在本场战斗中触发过
        if (this.params.oncePerBattle && Endure.triggeredInBattle.has(defender.id)) {
            results.push(this.createResult(false, 'defender', 'endure_used', '忍耐效果已在本场战斗中使用过', 0));
            return results;
        }
        // 检查概率
        const probability = this.params.probability || 100;
        if (!this.checkProbability(probability)) {
            results.push(this.createResult(false, 'defender', 'endure_failed', `忍耐效果触发失败（概率${probability}%）`, 0));
            return results;
        }
        // 触发忍耐效果
        const minHp = this.params.minHp || 1;
        const newDamage = defender.hp - minHp;
        // 修改伤害值，确保保留最小HP
        context.damage = Math.max(0, newDamage);
        // 标记已触发
        if (this.params.oncePerBattle) {
            Endure.triggeredInBattle.add(defender.id);
        }
        results.push(this.createResult(true, 'defender', 'endure', `忍耐效果触发，保留${minHp}点HP`, minHp, { originalDamage: damage, newDamage: context.damage, minHp }));
        this.log(`忍耐效果触发: 原伤害${damage}, 修正后${context.damage}, 保留${minHp}HP`);
        return results;
    }
    validate(params) {
        return params &&
            params.type === IAtomicEffect_1.AtomicEffectType.SPECIAL &&
            params.specialType === 'endure' &&
            typeof params.duration === 'number' &&
            params.duration > 0;
    }
    /**
     * 重置战斗触发记录（新战斗开始时调用）
     */
    static ResetBattleTriggers() {
        Endure.triggeredInBattle.clear();
    }
    /**
     * 检查精灵是否已触发过忍耐
     */
    static HasTriggered(petId) {
        return Endure.triggeredInBattle.has(petId);
    }
}
exports.Endure = Endure;
/**
 * 免疫效果原子效果
 * 使目标免疫特定类型的效果
 */
class ImmuneEffect extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.IMMUNE, 'Immune Effect', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const target = this.getTarget(context, this.params.target);
        if (!target)
            return results;
        if (this.params.immuneType === 'damage' && context.damage) {
            context.damage = 0;
            results.push(this.createResult(true, this.params.target === 'self' ? 'attacker' : 'defender', 'immune', '免疫伤害', 0));
        }
        return results;
    }
    validate(params) {
        return params && params.type === IAtomicEffect_1.AtomicEffectType.IMMUNE &&
            ['self', 'opponent'].includes(params.target) &&
            ['damage', 'status', 'stat_change'].includes(params.immuneType);
    }
}
exports.ImmuneEffect = ImmuneEffect;
/**
 * 反弹效果原子效果
 * 将受到的伤害按比例反弹给攻击者
 */
class ReflectEffect extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.REFLECT, 'Reflect Effect', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        if (!context.damage || context.damage <= 0)
            return results;
        const reflectDamage = Math.floor(context.damage * this.params.reflectRatio);
        if (reflectDamage > 0 && context.attacker) {
            if (__universeBudget.battleFor(context.attacker)) { __ubReflect(context.attacker, context.defender, reflectDamage, 'atomic-reflect'); } else { context.attacker.hp = Math.max(0, context.attacker.hp - reflectDamage); }
            results.push(this.createResult(true, 'attacker', 'reflect', `反弹${__universeBudget.battleFor(context.attacker) ? "待结算" : reflectDamage}点伤害`, reflectDamage));
        }
        return results;
    }
    validate(params) {
        return params && params.type === IAtomicEffect_1.AtomicEffectType.REFLECT &&
            typeof params.reflectRatio === 'number' && params.reflectRatio > 0 && params.reflectRatio <= 1;
    }
}
exports.ReflectEffect = ReflectEffect;
//# sourceMappingURL=DefensiveEffects.js.map
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
