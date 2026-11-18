"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SameTypeAbsorbPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 同系吸收被动效果
 * BOSS特性4: 受到与自身相同系属的攻击会恢复自身相应体力
 *
 * 实现方式：
 * - 在伤害计算后检查攻击属性
 * - 如果攻击属性与防御方属性相同，将伤害转换为治疗
 */
class SameTypeAbsorbPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor() {
        super('heal', 'SameTypeAbsorbPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC]);
    }
    validate(params) {
        return true; // 无参数，总是有效
    }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const skillType = context.skillType;
        // 检查技能属性是否与防御方属性相同
        if (skillType === defender.type && context.damage && context.damage > 0) {
            const healAmount = context.damage;
            // 将伤害转换为治疗
            context.damage = 0; // 取消伤害
            // 恢复体力（不超过最大值）
            const oldHp = defender.hp;
            if (__universeBudget.battleFor(defender)) { __ubHeal(defender, healAmount, 'type-absorb', false); } else { defender.hp = Math.min(defender.maxHp, defender.hp + healAmount); }
            const actualHeal = defender.hp - oldHp;
            this.log(`精灵 ${defender.name} 吸收同系攻击: 恢复 ${actualHeal} HP`, 'info');
            results.push(this.createResult(true, 'defender', 'heal', `${defender.name} 吸收了同系攻击，恢复 ${actualHeal} HP`, actualHeal, {
                universeAlreadyApplied: true,
                absorbedDamage: healAmount,
                skillType: skillType,
                defenderType: defender.type
            }));
        }
        return results;
    }
}
exports.SameTypeAbsorbPassive = SameTypeAbsorbPassive;
//# sourceMappingURL=SameTypeAbsorbPassive.js.map
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
