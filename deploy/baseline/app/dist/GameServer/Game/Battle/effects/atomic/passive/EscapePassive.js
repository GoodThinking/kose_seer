"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscapePassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 定时逃跑 (2013)
 * n回合逃跑，遇到指定精灵/属性时不逃跑
 * effectArgs: [turnCount, exceptPetId, exceptType1, exceptType2]
 */
class EscapePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'EscapePassive', [EffectContext_1.EffectTiming.TURN_END]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        const turnCount = context.effectArgs?.[0] || 0;
        const exceptPetId = context.effectArgs?.[1] || 0;
        const exceptType1 = context.effectArgs?.[2] || 0;
        const exceptType2 = context.effectArgs?.[3] || 0;
        // 检查是否遇到不逃跑的精灵
        if (exceptPetId > 0 && defender.petId === exceptPetId)
            return results;
        if (exceptType1 > 0 && defender.type === exceptType1)
            return results;
        if (exceptType2 > 0 && defender.type === exceptType2)
            return results;
        if (!__ubFatal(attacker) && turnCount > 0 && context.turn >= turnCount) {
            attacker.hp = 0;
            this.log(`定时逃跑: ${attacker.name} 在第 ${context.turn} 回合逃跑`, 'info');
            results.push(this.createResult(true, 'attacker', 'escape', `${attacker.name} 逃跑了`, 0, { turnCount, turn: context.turn }));
        }
        return results;
    }
}
exports.EscapePassive = EscapePassive;
//# sourceMappingURL=EscapePassive.js.map
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
