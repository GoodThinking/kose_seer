"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviveFullPassive = exports.ReviveOnDeathPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 死亡回血 (2025)
 * 如果HP被打成0，则立刻增加一些HP
 */
class ReviveOnDeathPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'ReviveOnDeathPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        if (defender.hp <= 0 && !__ubFatal(defender)) {
            if (!defender.effectCounters)
                defender.effectCounters = {};
            if (defender.effectCounters.reviveOnDeathUsed)
                return results;
            const healAmount = Math.floor(defender.maxHp * 0.25);
            defender.hp = healAmount;
            defender.effectCounters.reviveOnDeathUsed = true;
            this.log(`死亡回血: ${defender.name} 恢复 ${healAmount} HP`, 'info');
            results.push(this.createResult(true, 'defender', 'revive_on_death', `${defender.name} 死亡后恢复了 ${healAmount} HP`, healAmount));
        }
        return results;
    }
}
exports.ReviveOnDeathPassive = ReviveOnDeathPassive;
/**
 * 重生 (2044)
 * 重生(HP和btl_maxhp恢复到maxhp+maxhp_adj，技能PP值回满)
 * effectArgs: [maxRevives]
 */
class ReviveFullPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'ReviveFullPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const maxRevives = context.effectArgs?.[0] || 1;
        if (defender.hp <= 0 && !__ubFatal(defender)) {
            if (!defender.effectCounters)
                defender.effectCounters = {};
            const reviveCount = defender.effectCounters.reviveCount || 0;
            if (reviveCount < maxRevives) {
                defender.hp = defender.maxHp;
                defender.effectCounters.reviveCount = reviveCount + 1;
                // 恢复PP
                if (defender.skillPP) {
                    for (let i = 0; i < defender.skillPP.length; i++) {
                        defender.skillPP[i] = 99;
                    }
                }
                this.log(`重生: ${defender.name} 完全重生 (${reviveCount + 1}/${maxRevives})`, 'info');
                results.push(this.createResult(true, 'defender', 'revive_full', `${defender.name} 重生了！HP和PP全恢复`, defender.maxHp, { reviveCount: reviveCount + 1, maxRevives }));
            }
        }
        return results;
    }
}
exports.ReviveFullPassive = ReviveFullPassive;
//# sourceMappingURL=RevivePassives.js.map
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
