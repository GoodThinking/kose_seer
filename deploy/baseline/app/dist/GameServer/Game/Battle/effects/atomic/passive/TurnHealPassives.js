"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurnEnemyDamagePassive = exports.AsymmetricTurnHealPassive = exports.TurnDrainPassive = exports.BothTurnDamagePassive = exports.BothTurnHealPercentPassive = exports.TurnEndHealPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 每回合回血 (2041)
 * 每回合恢复自身n点体力
 * effectArgs: [healAmount]
 */
class TurnEndHealPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'TurnEndHealPassive', [EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const healAmount = context.effectArgs?.[0] || 0;
        if (healAmount > 0 && attacker.hp > 0) {
            const oldHp = attacker.hp;
            if (__universeBudget.battleFor(attacker)) { __ubHeal(attacker, healAmount, 'turn-heal', false); } else { attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount); }
            const actualHeal = attacker.hp - oldHp;
            if (actualHeal > 0) {
                results.push(this.createResult(true, 'attacker', 'turn_end_heal', `${attacker.name} 恢复 ${actualHeal} HP`, actualHeal));
            }
        }
        return results;
    }
}
exports.TurnEndHealPassive = TurnEndHealPassive;
/**
 * 双方回血 (2053)
 * 敌我双方每回合恢复n%HP
 * effectArgs: [healPercent]
 */
class BothTurnHealPercentPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'BothTurnHealPercentPassive', [EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const healPercent = context.effectArgs?.[0] || 0;
        if (healPercent > 0) {
            for (const pet of [attacker, defender]) {
                if (pet.hp > 0) {
                    const healAmount = Math.floor(pet.maxHp * healPercent / 100);
                    const oldHp = pet.hp;
                    if (__universeBudget.battleFor(pet)) { __ubHeal(pet, healAmount, 'turn-heal', false); } else { pet.hp = Math.min(pet.maxHp, pet.hp + healAmount); }
                    const actualHeal = pet.hp - oldHp;
                    if (actualHeal > 0) {
                        const target = pet === attacker ? 'attacker' : 'defender';
                        results.push(this.createResult(true, target, 'both_turn_heal', `${pet.name} 恢复 ${actualHeal} HP`, actualHeal, { healPercent }));
                    }
                }
            }
        }
        return results;
    }
}
exports.BothTurnHealPercentPassive = BothTurnHealPercentPassive;
/**
 * 双方扣血 (2054)
 * 每回合结束后，敌我双方扣除n体力值
 * effectArgs: [damageAmount]
 */
class BothTurnDamagePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'BothTurnDamagePassive', [EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const damageAmount = context.effectArgs?.[0] || 0;
        if (damageAmount > 0) {
            for (const pet of [attacker, defender]) {
                if (pet.hp > 0) {
                    if (__universeBudget.battleFor(pet)) { __ubDamage(attacker, pet, damageAmount, 'dot'); } else { pet.hp = Math.max(0, pet.hp - damageAmount); }
                    const target = pet === attacker ? 'attacker' : 'defender';
                    results.push(this.createResult(true, target, 'both_turn_damage', `${pet.name} 损失 ${damageAmount} HP`, damageAmount));
                }
            }
        }
        return results;
    }
}
exports.BothTurnDamagePassive = BothTurnDamagePassive;
/**
 * 回合吸血 (2071)
 * 每回合结束时，对手降低n体力，自身恢复m体力
 * effectArgs: [enemyDamage, selfHeal]
 */
class TurnDrainPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'TurnDrainPassive', [EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const enemyDamage = context.effectArgs?.[0] || 0;
        const selfHeal = context.effectArgs?.[1] || 0;
        if (defender.hp > 0 && enemyDamage > 0) {
            if (__universeBudget.battleFor(defender)) { __ubDamage(attacker, defender, enemyDamage, 'dot'); } else { defender.hp = Math.max(0, defender.hp - enemyDamage); }
            results.push(this.createResult(true, 'defender', 'turn_drain_damage', `${defender.name} 损失 ${enemyDamage} HP`, enemyDamage));
        }
        if (attacker.hp > 0 && selfHeal > 0) {
            const oldHp = attacker.hp;
            if (__universeBudget.battleFor(attacker)) { __ubHeal(attacker, selfHeal, 'turn-drain-heal', false); } else { attacker.hp = Math.min(attacker.maxHp, attacker.hp + selfHeal); }
            const actualHeal = attacker.hp - oldHp;
            if (actualHeal > 0) {
                results.push(this.createResult(true, 'attacker', 'turn_drain_heal', `${attacker.name} 恢复 ${actualHeal} HP`, actualHeal));
            }
        }
        return results;
    }
}
exports.TurnDrainPassive = TurnDrainPassive;
/**
 * 差异回血 (2075)
 * 每回合敌方恢复m%HP，我方恢复n%HP
 * effectArgs: [enemyHealPercent, selfHealPercent]
 */
class AsymmetricTurnHealPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'AsymmetricTurnHealPassive', [EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const enemyHealPercent = context.effectArgs?.[0] || 0;
        const selfHealPercent = context.effectArgs?.[1] || 0;
        if (defender.hp > 0 && enemyHealPercent > 0) {
            const healAmount = Math.floor(defender.maxHp * enemyHealPercent / 100);
            const oldHp = defender.hp;
            if (__universeBudget.battleFor(defender)) { __ubHeal(defender, healAmount, 'turn-heal', false); } else { defender.hp = Math.min(defender.maxHp, defender.hp + healAmount); }
            const actualHeal = defender.hp - oldHp;
            if (actualHeal > 0) {
                results.push(this.createResult(true, 'defender', 'asymmetric_heal', `${defender.name} 恢复 ${actualHeal} HP`, actualHeal, { healPercent: enemyHealPercent }));
            }
        }
        if (attacker.hp > 0 && selfHealPercent > 0) {
            const healAmount = Math.floor(attacker.maxHp * selfHealPercent / 100);
            const oldHp = attacker.hp;
            if (__universeBudget.battleFor(attacker)) { __ubHeal(attacker, healAmount, 'turn-heal', false); } else { attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount); }
            const actualHeal = attacker.hp - oldHp;
            if (actualHeal > 0) {
                results.push(this.createResult(true, 'attacker', 'asymmetric_heal', `${attacker.name} 恢复 ${actualHeal} HP`, actualHeal, { healPercent: selfHealPercent }));
            }
        }
        return results;
    }
}
exports.AsymmetricTurnHealPassive = AsymmetricTurnHealPassive;
/**
 * 每回合扣敌血 (2077)
 * 每回合损失对手n点体力
 * effectArgs: [damageAmount]
 */
class TurnEnemyDamagePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'TurnEnemyDamagePassive', [EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const damageAmount = context.effectArgs?.[0] || 0;
        if (damageAmount > 0 && defender.hp > 0) {
            if (__universeBudget.battleFor(defender)) { __ubDamage(attacker, defender, damageAmount, 'dot'); } else { defender.hp = Math.max(0, defender.hp - damageAmount); }
            results.push(this.createResult(true, 'defender', 'turn_enemy_damage', `${defender.name} 损失 ${damageAmount} HP`, damageAmount));
        }
        return results;
    }
}
exports.TurnEnemyDamagePassive = TurnEnemyDamagePassive;
//# sourceMappingURL=TurnHealPassives.js.map
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
