"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecificTypeAbsorbPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 特定系吸收 (2068)
 * 受到特定系的攻击会恢复自身相应体力
 * effectArgs: [elementType]
 */
class SpecificTypeAbsorbPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'SpecificTypeAbsorbPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const elementType = context.effectArgs?.[0] || 0;
        if (elementType > 0 && context.skillType === elementType && context.damage > 0) {
            const healAmount = context.damage;
            context.damage = 0;
            const oldHp = defender.hp;
            if (__universeBudget.battleFor(defender)) { __ubHeal(defender, healAmount, 'type-absorb', false); } else { defender.hp = Math.min(defender.maxHp, defender.hp + healAmount); }
            const actualHeal = defender.hp - oldHp;
            this.log(`特定系吸收: ${defender.name} 吸收属性${elementType}攻击，恢复 ${actualHeal} HP`, 'info');
            results.push(this.createResult(true, 'defender', 'specific_type_absorb', `${defender.name} 吸收了攻击，恢复 ${actualHeal} HP`, actualHeal, { elementType, absorbedDamage: healAmount }));
        }
        return results;
    }
}
exports.SpecificTypeAbsorbPassive = SpecificTypeAbsorbPassive;
//# sourceMappingURL=SpecificTypeAbsorbPassive.js.map
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
