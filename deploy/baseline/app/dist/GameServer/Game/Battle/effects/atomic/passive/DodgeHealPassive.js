"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DodgeHealPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 闪避回血 (2082)
 * 每躲避一次攻击，该回合结束后会回复n体力
 * effectArgs: [healAmount]
 */
class DodgeHealPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'DodgeHealPassive', [EffectContext_1.EffectTiming.AFTER_HIT_CHECK, EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const healAmount = context.effectArgs?.[0] || 0;
        if (!defender.effectCounters)
            defender.effectCounters = {};
        if (context.timing === EffectContext_1.EffectTiming.AFTER_HIT_CHECK) {
            // 记录闪避
            if (context.isMiss) {
                defender.effectCounters.dodgeHealPending = (defender.effectCounters.dodgeHealPending || 0) + healAmount;
                results.push(this.createResult(true, 'defender', 'dodge_heal_pending', `闪避成功，回合结束后恢复 ${healAmount} HP`, healAmount));
            }
        }
        else if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            // 回合结束时恢复
            const pendingHeal = defender.effectCounters.dodgeHealPending || 0;
            if (pendingHeal > 0 && defender.hp > 0) {
                const oldHp = defender.hp;
                if (__universeBudget.battleFor(defender)) { __ubHeal(defender, pendingHeal, 'dodge-heal', false); } else { defender.hp = Math.min(defender.maxHp, defender.hp + pendingHeal); }
                const actualHeal = defender.hp - oldHp;
                defender.effectCounters.dodgeHealPending = 0;
                if (actualHeal > 0) {
                    this.log(`闪避回血: ${defender.name} 恢复 ${actualHeal} HP`, 'info');
                    results.push(this.createResult(true, 'defender', 'dodge_heal', `${defender.name} 闪避回血 ${actualHeal} HP`, actualHeal));
                }
            }
        }
        return results;
    }
}
exports.DodgeHealPassive = DodgeHealPassive;
//# sourceMappingURL=DodgeHealPassive.js.map
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
