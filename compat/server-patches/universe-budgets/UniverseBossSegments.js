'use strict';

const {SkillEffectRuntime} = require('./SkillEffectRuntime');
const {BattleEffectIntegration} = require('./BattleEffectIntegration');
const rules = require('./UniverseBossRules');
const budget = require('./UniverseBossBudget');

// These three encounters change their own defense between hits. Their native
// action-level shields and fixed reductions are consumed in hit order, while
// BEFORE_DAMAGE_APPLY and passive shield activation run once for the action.
function settle(battle, attacker, defender, skill, directTotal, fraction, count, nativeReduction, hasDirect) {
    const action = battle.universeBudgetState.actionContext;
    const cap = SkillEffectRuntime.Get(defender, 'cap');
    let capRemaining = cap ? Math.max(0, cap.max) : Infinity;
    let flatRemaining = Math.max(0, action.passiveFlatReduction || 0);
    let passiveChecked = false, passiveAllowed = true, beforeChecked = false;
    let direct = 0, indirect = 0;

    function consume(amount, kind) {
        amount = Math.max(0, Math.floor(amount));
        const capped = Math.min(amount, capRemaining);
        capRemaining -= capped;
        amount = capped;
        const shield = SkillEffectRuntime.Get(defender, 'shield');
        if (shield && amount > 0) {
            const absorbed = Math.min(shield.points, amount);
            shield.points -= absorbed;
            amount -= absorbed;
            if (shield.points <= 0) delete defender.effectStates.shield;
        }
        if (SkillEffectRuntime.Get(defender, 'absorbToHp')) {
            if (amount > 0) SkillEffectRuntime.Heal(defender, amount);
            amount = 0;
        } else if (SkillEffectRuntime.Get(defender, 'endure')) {
            amount = Math.min(amount, Math.max(0, defender.hp - 1 - direct - indirect));
        }
        if (amount > 0 && !passiveChecked) {
            passiveChecked = true;
            passiveAllowed = SkillEffectRuntime.Passive.Shield(battle, defender, skill, amount) > 0;
        }
        if (!passiveAllowed) amount = 0;
        const flat = Math.min(flatRemaining, amount);
        flatRemaining -= flat;
        amount -= flat;
        if (!beforeChecked) {
            beforeChecked = true;
            amount = BattleEffectIntegration.OnBeforeDamageApply(attacker, defender, skill, amount).damage;
        }
        const remainingHp = Math.max(0, defender.hp - direct - indirect);
        return budget.damage(battle, attacker, defender, kind, amount, {indirectModified: true, remainingHp});
    }

    if (hasDirect) {
        rules.beforeDirectDamage(battle, attacker, defender, skill);
        for (let index = 0; index < count && direct + indirect < defender.hp; index++) {
            const base = Math.floor(directTotal / count) + (index < directTotal % count ? 1 : 0);
            const native = Math.floor(base * (100 - nativeReduction) / 100);
            const modified = base > 0 ? Math.max(0, Math.floor(rules.modifyDirectDamage(battle, attacker, defender, skill, base, native))) : 0;
            const actual = consume(modified, 'direct');
            direct += actual;
            rules.onDirectDamageSegment(battle, attacker, defender, skill, {index, count, actualDamage: actual});
        }
    }
    if (fraction > 0 && direct + indirect < defender.hp) {
        indirect = consume(Math.max(0, Math.floor(rules.modifyIndirectDamage(battle, attacker, defender, 'fraction', fraction)) || 0), 'fraction');
    }
    if (!beforeChecked) BattleEffectIntegration.OnBeforeDamageApply(attacker, defender, skill, 0);
    return {direct, damage: direct + indirect};
}

module.exports = {settle};
