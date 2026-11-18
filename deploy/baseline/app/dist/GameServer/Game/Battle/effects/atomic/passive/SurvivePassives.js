"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FiveTurnImmortalPassive = exports.SurviveLethalChancePassive = exports.SurviveWith1HpPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 致死余1 (2021)
 * 除ID为xxx的技能外，任何能将自身体力降为0的技能都会使自身余下1体力
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
class SurviveWith1HpPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'SurviveWith1HpPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const exceptSkills = (context.effectArgs || []).filter(id => id > 0);
        // 如果是例外技能，不触发
        if (exceptSkills.includes(context.skillId))
            return results;
        // 如果伤害会致死
        if (!__ubFatal(defender) && context.damage >= defender.hp && defender.hp > 0) {
            context.damage = defender.hp - 1;
            this.log(`致死余1: ${defender.name} 余下1HP`, 'info');
            results.push(this.createResult(true, 'defender', 'survive_1hp', `${defender.name} 顽强地余下了1点体力`, 1, { exceptSkills }));
        }
        return results;
    }
}
exports.SurviveWith1HpPassive = SurviveWith1HpPassive;
/**
 * 致死存活 (2031)
 * 受到致死攻击时有n%几率余下m点体力
 * effectArgs: [chance, remainHp]
 */
class SurviveLethalChancePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'SurviveLethalChancePassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const chance = context.effectArgs?.[0] || 0;
        const remainHp = context.effectArgs?.[1] || 1;
        if (!__ubFatal(defender) && context.damage >= defender.hp && defender.hp > 0 && this.checkProbability(chance)) {
            context.damage = defender.hp - remainHp;
            this.log(`致死存活: ${defender.name} 余下 ${remainHp} HP`, 'info');
            results.push(this.createResult(true, 'defender', 'survive_lethal', `${defender.name} 幸运地余下了 ${remainHp} 点体力`, remainHp, { chance, remainHp }));
        }
        return results;
    }
}
exports.SurviveLethalChancePassive = SurviveLethalChancePassive;
/**
 * 五回合不死 (2046)
 * 若自身5回合内体力被降到0会余下1点体力，并且体力全恢复，恢复后回合数重新计算
 */
class FiveTurnImmortalPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'FiveTurnImmortalPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        if (!defender.effectCounters)
            defender.effectCounters = {};
        const cycleStart = defender.effectCounters.immortalCycleStart || 1;
        const turnsInCycle = context.turn - cycleStart + 1;
        if (!__ubFatal(defender) && turnsInCycle <= 5 && context.damage >= defender.hp && defender.hp > 0) {
            context.damage = defender.hp - 1;
            // 全恢复并重置周期
            if (__universeBudget.battleFor(defender)) { __ubHeal(defender, defender.maxHp - defender.hp, 'immortal-recovery', false); } else { defender.hp = defender.maxHp; }
            defender.effectCounters.immortalCycleStart = context.turn + 1;
            this.log(`五回合不死: ${defender.name} 全恢复，重置周期`, 'info');
            results.push(this.createResult(true, 'defender', 'five_turn_immortal', `${defender.name} 在不死周期内，体力全恢复`, defender.maxHp, { turnsInCycle, cycleStart }));
        }
        return results;
    }
}
exports.FiveTurnImmortalPassive = FiveTurnImmortalPassive;
//# sourceMappingURL=SurvivePassives.js.map
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
