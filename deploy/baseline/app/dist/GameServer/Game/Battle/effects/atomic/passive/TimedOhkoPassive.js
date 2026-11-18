"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimedOhkoPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 定时秒杀 (2056)
 * 第n回合秒杀敌人
 * effectArgs: [turnNumber]
 */
class TimedOhkoPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'TimedOhkoPassive', [EffectContext_1.EffectTiming.TURN_START]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const turnNumber = context.effectArgs?.[0] || 0;
        if (!__ubFatal(defender) && turnNumber > 0 && context.turn === turnNumber && defender.hp > 0) {
            defender.hp = 0;
            this.log(`定时秒杀: 第 ${turnNumber} 回合秒杀 ${defender.name}`, 'info');
            results.push(this.createResult(true, 'defender', 'timed_ohko', `第 ${turnNumber} 回合秒杀 ${defender.name}`, defender.maxHp, { turnNumber }));
        }
        return results;
    }
}
exports.TimedOhkoPassive = TimedOhkoPassive;
//# sourceMappingURL=TimedOhkoPassive.js.map
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
