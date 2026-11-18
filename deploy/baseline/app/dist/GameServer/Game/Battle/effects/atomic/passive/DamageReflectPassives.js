"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighDamageReflectPassive = exports.DamageReflectFractionPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 伤害反弹 (2011)
 * 受到任何攻击都会反弹1/n的伤害给对方
 * effectArgs: [divisor]
 */
class DamageReflectFractionPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'DamageReflectFractionPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const divisor = context.effectArgs?.[0] || 4;
        if (context.damage > 0 && divisor > 0) {
            const reflectDamage = Math.floor(context.damage / divisor);
            if (reflectDamage > 0) {
                if (__universeBudget.battleFor(attacker)) { __ubReflect(attacker, defender, reflectDamage, 'passive-reflection'); } else { attacker.hp = Math.max(0, attacker.hp - reflectDamage); }
                this.log(`伤害反弹: 反弹 ${__universeBudget.battleFor(context.attacker) ? "待结算" : reflectDamage} 伤害给 ${attacker.name}`, 'info');
                results.push(this.createResult(true, 'attacker', 'damage_reflect', `反弹了 ${__universeBudget.battleFor(context.attacker) ? "待结算" : reflectDamage} 点伤害`, reflectDamage, { divisor, originalDamage: context.damage }));
            }
        }
        return results;
    }
}
exports.DamageReflectFractionPassive = DamageReflectFractionPassive;
/**
 * 高伤反弹 (2083)
 * 受到超过n的伤害时，反弹m%伤害
 * effectArgs: [threshold, reflectPercent]
 */
class HighDamageReflectPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'HighDamageReflectPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const threshold = context.effectArgs?.[0] || 0;
        const reflectPercent = context.effectArgs?.[1] || 0;
        if (context.damage > threshold && reflectPercent > 0) {
            const reflectDamage = Math.floor(context.damage * reflectPercent / 100);
            if (reflectDamage > 0) {
                if (__universeBudget.battleFor(attacker)) { __ubReflect(attacker, defender, reflectDamage, 'passive-reflection'); } else { attacker.hp = Math.max(0, attacker.hp - reflectDamage); }
                this.log(`高伤反弹: 伤害 ${context.damage} > ${threshold}, 反弹 ${__universeBudget.battleFor(context.attacker) ? "待结算" : reflectDamage}`, 'info');
                results.push(this.createResult(true, 'attacker', 'high_damage_reflect', `反弹了 ${__universeBudget.battleFor(context.attacker) ? "待结算" : reflectDamage} 点伤害`, reflectDamage, { threshold, reflectPercent, originalDamage: context.damage }));
            }
        }
        return results;
    }
}
exports.HighDamageReflectPassive = HighDamageReflectPassive;
//# sourceMappingURL=DamageReflectPassives.js.map
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
