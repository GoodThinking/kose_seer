"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighDamageCounterKillPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 高伤反杀 (2037)
 * 自身一次受到大于n的伤害时直接将对方体力降至0
 * effectArgs: [thresholdHigh, thresholdLow]
 */
class HighDamageCounterKillPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'HighDamageCounterKillPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const thresholdHigh = context.effectArgs?.[0] || 0;
        const thresholdLow = context.effectArgs?.[1] || 0;
        const threshold = (thresholdHigh << 16) | thresholdLow;
        if (!__ubFatal(attacker) && context.damage > threshold && attacker.hp > 0) {
            attacker.hp = 0;
            this.log(`高伤反杀: 伤害 ${context.damage} > ${threshold}, 秒杀 ${attacker.name}`, 'info');
            results.push(this.createResult(true, 'attacker', 'high_damage_counter_kill', `${attacker.name} 被反杀`, attacker.maxHp, { threshold, damage: context.damage }));
        }
        return results;
    }
}
exports.HighDamageCounterKillPassive = HighDamageCounterKillPassive;
//# sourceMappingURL=HighDamageCounterKillPassive.js.map
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
