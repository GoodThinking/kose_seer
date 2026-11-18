"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowHpFullHealChancePassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 低血概率回满 (2033)
 * 精灵体力降低到1/n时有m%几率体力回满
 * effectArgs: [hpFraction, chance]
 */
class LowHpFullHealChancePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'LowHpFullHealChancePassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const hpFraction = context.effectArgs?.[0] || 4;
        const chance = context.effectArgs?.[1] || 0;
        if (defender.hp > 0 && defender.maxHp > 0 && hpFraction > 0) {
            const threshold = Math.floor(defender.maxHp / hpFraction);
            if (defender.hp <= threshold && this.checkProbability(chance)) {
                const oldHp = defender.hp;
                if (__universeBudget.battleFor(defender)) { __ubHeal(defender, defender.maxHp - defender.hp, 'chance-recovery', false); } else { defender.hp = defender.maxHp; }
                this.log(`低血概率回满: ${defender.name} HP ${oldHp} -> ${defender.maxHp}`, 'info');
                results.push(this.createResult(true, 'defender', 'low_hp_full_heal', `${defender.name} 体力回满！`, defender.maxHp - oldHp, { hpFraction, chance, threshold }));
            }
        }
        return results;
    }
}
exports.LowHpFullHealChancePassive = LowHpFullHealChancePassive;
//# sourceMappingURL=LowHpFullHealChancePassive.js.map
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
