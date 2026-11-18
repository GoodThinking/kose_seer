"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounterPriorityReducePassive = exports.CounterDamageReducePassive = exports.CounterFearPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 天敌害怕 (2014)
 * 若遇到天敌，则战斗开始时连续害怕n回合
 * effectArgs: [fearTurns]
 * 天敌判定：对方属性克制自身属性
 */
class CounterFearPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'CounterFearPassive', [EffectContext_1.EffectTiming.BATTLE_START]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const fearTurns = context.effectArgs?.[0] || 0;
        if (fearTurns > 0) {
            // 设置害怕状态
            if (!attacker.statusDurations)
                attacker.statusDurations = new Array(20).fill(0);
            if (__ubBlocked(attacker, 6, defender)) return results;
            attacker.statusDurations[6] = fearTurns; // 6 = FEAR
            attacker.status = 6;
            attacker.statusTurns = fearTurns;
            if (!attacker.effectCounters)
                attacker.effectCounters = {};
            attacker.effectCounters.counterFear = fearTurns;
            this.log(`天敌害怕: ${attacker.name} 害怕 ${fearTurns} 回合`, 'info');
            results.push(this.createResult(true, 'attacker', 'counter_fear', `${attacker.name} 遇到天敌，害怕 ${fearTurns} 回合`, fearTurns));
        }
        return results;
    }
}
exports.CounterFearPassive = CounterFearPassive;
/**
 * 天敌伤害减少 (2015)
 * 若遇到天敌，则整个战斗中对天敌的伤害减少n%
 * effectArgs: [reducePercent]
 */
class CounterDamageReducePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'CounterDamageReducePassive', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const reducePercent = context.effectArgs?.[0] || 0;
        if (reducePercent > 0 && context.damage > 0) {
            const reduction = Math.floor(context.damage * reducePercent / 100);
            context.damage = Math.max(1, context.damage - reduction);
            context.damageMultiplier *= (1 - reducePercent / 100);
            this.log(`天敌伤害减少: 伤害减少 ${reducePercent}%`, 'info');
            results.push(this.createResult(true, 'attacker', 'counter_damage_reduce', `对天敌伤害减少 ${reducePercent}%`, reduction, { reducePercent }));
        }
        return results;
    }
}
exports.CounterDamageReducePassive = CounterDamageReducePassive;
/**
 * 天敌先制降低 (2043)
 * 遇到天敌自身所有技能先制减少n
 * effectArgs: [priorityReduce]
 */
class CounterPriorityReducePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'CounterPriorityReducePassive', [EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const priorityReduce = context.effectArgs?.[0] || 0;
        if (priorityReduce > 0) {
            context.priorityModifier -= priorityReduce;
            this.log(`天敌先制降低: 先制 -${priorityReduce}`, 'info');
            results.push(this.createResult(true, 'attacker', 'counter_priority_reduce', `先制降低 ${priorityReduce}`, priorityReduce));
        }
        return results;
    }
}
exports.CounterPriorityReducePassive = CounterPriorityReducePassive;
//# sourceMappingURL=CounterPassives.js.map
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
