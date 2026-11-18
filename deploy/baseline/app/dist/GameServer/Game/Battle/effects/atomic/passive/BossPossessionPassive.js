"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BossPossessionPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 魔王附身 (2059)
 * 按一定条件触发魔王的附身，触发时受到伤害时n回合内反弹m%伤害给玩家
 * effectArgs: [duration, reflectPercent]
 */
class BossPossessionPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'BossPossessionPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const attacker = this.getAttacker(context);
        const duration = context.effectArgs?.[0] || 0;
        const reflectPercent = context.effectArgs?.[1] || 0;
        if (!defender.effectCounters)
            defender.effectCounters = {};
        // 检查是否已在附身状态
        const possessionTurns = defender.effectCounters.possessionTurns || 0;
        if (possessionTurns > 0 && context.damage > 0) {
            // 附身状态下反弹伤害
            const reflectDamage = Math.floor(context.damage * reflectPercent / 100);
            if (reflectDamage > 0) {
                if (__universeBudget.battleFor(attacker)) { __ubReflect(attacker, defender, reflectDamage, 'possession'); } else { attacker.hp = Math.max(0, attacker.hp - reflectDamage); }
                defender.effectCounters.possessionTurns = possessionTurns - 1;
                results.push(this.createResult(true, 'attacker', 'possession_reflect', `魔王附身反弹 ${__universeBudget.battleFor(context.attacker) ? "待结算" : reflectDamage} 伤害`, reflectDamage, { remainTurns: possessionTurns - 1 }));
            }
            return results;
        }
        // 触发条件：HP低于30%
        if (!defender.effectCounters.possessionTriggered &&
            defender.hp > 0 && defender.maxHp > 0 && defender.hp < defender.maxHp * 0.3) {
            defender.effectCounters.possessionTriggered = true;
            defender.effectCounters.possessionTurns = duration;
            this.log(`魔王附身: ${defender.name} 触发附身 ${duration} 回合`, 'info');
            results.push(this.createResult(true, 'defender', 'boss_possession', `${defender.name} 触发了魔王附身！`, 0, { duration, reflectPercent }));
        }
        return results;
    }
}
exports.BossPossessionPassive = BossPossessionPassive;
//# sourceMappingURL=BossPossessionPassive.js.map
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
