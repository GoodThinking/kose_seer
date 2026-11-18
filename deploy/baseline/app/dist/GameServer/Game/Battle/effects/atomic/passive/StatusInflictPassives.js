"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnSpHitStatusInflictPassive = exports.SpHitStatusInflictPassive = exports.PhysHitStatusInflictPassive = exports.OnHitStatusInflictPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 受击致异常 (2006)
 * 受到普通属性伤害时以n%的概率使对方进入异常状态
 * effectArgs: [statusType, chance]
 */
class OnHitStatusInflictPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'OnHitStatusInflictPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const attacker = this.getAttacker(context);
        const statusType = context.effectArgs?.[0] || 0;
        const chance = context.effectArgs?.[1] || 0;
        if (context.damage > 0 && context.skillType === 8 && this.checkProbability(chance)) {
            if (!attacker.statusDurations)
                attacker.statusDurations = new Array(20).fill(0);
            if (__ubBlocked(attacker, statusType, defender)) return results;
            attacker.statusDurations[statusType] = 3;
            attacker.status = statusType;
            attacker.statusTurns = 3;
            this.log(`${defender.name} 受击致异常: 使 ${attacker.name} 进入状态 ${statusType}`, 'info');
            results.push(this.createResult(true, 'attacker', 'status_inflict', `${attacker.name} 被施加了异常状态 ${statusType}`, statusType, { statusType, chance }));
        }
        return results;
    }
}
exports.OnHitStatusInflictPassive = OnHitStatusInflictPassive;
/**
 * 物攻致异常 (2066)
 * 自身的物攻有n%几率使对方处于异常状态
 * effectArgs: [chance, statusType]
 */
class PhysHitStatusInflictPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'PhysHitStatusInflictPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const chance = context.effectArgs?.[0] || 0;
        const statusType = context.effectArgs?.[1] || 0;
        if (context.damage > 0 && context.skillCategory === 1 && this.checkProbability(chance)) {
            if (!defender.statusDurations)
                defender.statusDurations = new Array(20).fill(0);
            if (__ubBlocked(defender, statusType, attacker)) return results;
            defender.statusDurations[statusType] = 3;
            defender.status = statusType;
            defender.statusTurns = 3;
            this.log(`${attacker.name} 物攻致异常: 使 ${defender.name} 进入状态 ${statusType}`, 'info');
            results.push(this.createResult(true, 'defender', 'status_inflict', `${defender.name} 被施加了异常状态 ${statusType}`, statusType, { statusType, chance }));
        }
        return results;
    }
}
exports.PhysHitStatusInflictPassive = PhysHitStatusInflictPassive;
/**
 * 特攻致异常 (2067)
 * 自身的特攻有n%几率使对方处于异常状态
 * effectArgs: [chance, statusType]
 */
class SpHitStatusInflictPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'SpHitStatusInflictPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const chance = context.effectArgs?.[0] || 0;
        const statusType = context.effectArgs?.[1] || 0;
        if (context.damage > 0 && context.skillCategory === 2 && this.checkProbability(chance)) {
            if (!defender.statusDurations)
                defender.statusDurations = new Array(20).fill(0);
            if (__ubBlocked(defender, statusType, attacker)) return results;
            defender.statusDurations[statusType] = 3;
            defender.status = statusType;
            defender.statusTurns = 3;
            this.log(`${attacker.name} 特攻致异常: 使 ${defender.name} 进入状态 ${statusType}`, 'info');
            results.push(this.createResult(true, 'defender', 'status_inflict', `${defender.name} 被施加了异常状态 ${statusType}`, statusType, { statusType, chance }));
        }
        return results;
    }
}
exports.SpHitStatusInflictPassive = SpHitStatusInflictPassive;
/**
 * 受特攻致异常 (2078)
 * 受到特殊攻击伤害时以n%的概率使对方进入异常状态
 * effectArgs: [statusType, chance]
 */
class OnSpHitStatusInflictPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'OnSpHitStatusInflictPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const attacker = this.getAttacker(context);
        const statusType = context.effectArgs?.[0] || 0;
        const chance = context.effectArgs?.[1] || 0;
        if (context.damage > 0 && context.skillCategory === 2 && this.checkProbability(chance)) {
            if (!attacker.statusDurations)
                attacker.statusDurations = new Array(20).fill(0);
            if (__ubBlocked(attacker, statusType, defender)) return results;
            attacker.statusDurations[statusType] = 3;
            attacker.status = statusType;
            attacker.statusTurns = 3;
            this.log(`${defender.name} 受特攻致异常: 使 ${attacker.name} 进入状态 ${statusType}`, 'info');
            results.push(this.createResult(true, 'attacker', 'status_inflict', `${attacker.name} 被施加了异常状态 ${statusType}`, statusType, { statusType, chance }));
        }
        return results;
    }
}
exports.OnSpHitStatusInflictPassive = OnSpHitStatusInflictPassive;
//# sourceMappingURL=StatusInflictPassives.js.map
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
