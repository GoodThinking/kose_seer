"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BurstRecoverFullHpPpPassive = exports.BurstRecoverFullHpPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 濒死回满 (2009)
 * 如果被打到BurstRecoverHP以下且没有挂掉则马上恢复到满HP
 * effectArgs: [burstHpHigh, burstHpLow] (组合为32位阈值)
 */
class BurstRecoverFullHpPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'BurstRecoverFullHpPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const burstHpHigh = context.effectArgs?.[0] || 0;
        const burstHpLow = context.effectArgs?.[1] || 0;
        const threshold = (burstHpHigh << 16) | burstHpLow;
        if (defender.hp > 0 && defender.hp <= threshold) {
            const oldHp = defender.hp;
            if (__universeBudget.battleFor(defender)) { __ubHeal(defender, defender.maxHp - defender.hp, 'burst-recovery', false); } else { defender.hp = defender.maxHp; }
            this.log(`濒死回满: ${defender.name} HP ${oldHp} -> ${defender.maxHp}`, 'info');
            results.push(this.createResult(true, 'defender', 'burst_recover', `${defender.name} 濒死回满，HP恢复至 ${defender.maxHp}`, defender.maxHp - oldHp, { threshold, oldHp }));
        }
        return results;
    }
}
exports.BurstRecoverFullHpPassive = BurstRecoverFullHpPassive;
/**
 * 濒死回满含PP (2051)
 * 如果被打到BurstRecoverHP以下且没有挂掉则马上恢复到满HP和PP值
 * effectArgs: [burstHpHigh, burstHpLow]
 */
class BurstRecoverFullHpPpPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'BurstRecoverFullHpPpPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const burstHpHigh = context.effectArgs?.[0] || 0;
        const burstHpLow = context.effectArgs?.[1] || 0;
        const threshold = (burstHpHigh << 16) | burstHpLow;
        if (defender.hp > 0 && defender.hp <= threshold) {
            const oldHp = defender.hp;
            if (__universeBudget.battleFor(defender)) { __ubHeal(defender, defender.maxHp - defender.hp, 'burst-recovery', false); } else { defender.hp = defender.maxHp; }
            // 恢复PP
            if (defender.skillPP) {
                for (let i = 0; i < defender.skillPP.length; i++) {
                    defender.skillPP[i] = 99;
                }
            }
            this.log(`濒死回满含PP: ${defender.name} HP和PP全恢复`, 'info');
            results.push(this.createResult(true, 'defender', 'burst_recover_pp', `${defender.name} 濒死回满，HP和PP全恢复`, defender.maxHp - oldHp, { threshold, oldHp, ppRestored: true }));
        }
        return results;
    }
}
exports.BurstRecoverFullHpPpPassive = BurstRecoverFullHpPpPassive;
//# sourceMappingURL=BurstRecoverPassives.js.map
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
