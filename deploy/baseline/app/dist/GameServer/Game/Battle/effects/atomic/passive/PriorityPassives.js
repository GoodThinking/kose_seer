"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HighDamageNextPriorityPassive = exports.LowHpPriorityPassive = exports.PriorityChangePassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 先制变化 (2042)
 * 自身所有技能先制改变n(+/-)
 * effectArgs: [priorityChange]
 */
class PriorityChangePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'PriorityChangePassive', [EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const priorityChange = context.effectArgs?.[0] || 0;
        if (priorityChange !== 0) {
            context.priorityModifier += priorityChange;
            results.push(this.createResult(true, 'attacker', 'priority_change', `先制变化 ${priorityChange > 0 ? '+' : ''}${priorityChange}`, priorityChange));
        }
        return results;
    }
}
exports.PriorityChangePassive = PriorityChangePassive;
/**
 * 低血必先手 (2097)
 * 体力低于n%时，必定先手
 * effectArgs: [hpPercent]
 */
class LowHpPriorityPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'LowHpPriorityPassive', [EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const hpPercent = context.effectArgs?.[0] || 0;
        if (hpPercent > 0 && attacker.hp > 0 && attacker.maxHp > 0) {
            const currentPercent = (attacker.hp / attacker.maxHp) * 100;
            if (currentPercent < hpPercent) {
                context.alwaysFirst = true;
                context.priorityModifier += 999;
                this.log(`低血必先手: ${attacker.name} HP ${currentPercent.toFixed(1)}% < ${hpPercent}%`, 'info');
                results.push(this.createResult(true, 'attacker', 'low_hp_priority', `${attacker.name} 低血必先手`, 0, { hpPercent, currentPercent }));
            }
        }
        return results;
    }
}
exports.LowHpPriorityPassive = LowHpPriorityPassive;
/**
 * 高伤下回合先手 (2098)
 * 受到超过n的伤害时，下回合必定先出手
 * effectArgs: [threshold]
 */
class HighDamageNextPriorityPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'HighDamageNextPriorityPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY, EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const threshold = context.effectArgs?.[0] || 0;
        if (!defender.effectCounters)
            defender.effectCounters = {};
        if (context.timing === EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY) {
            if (context.damage > threshold) {
                defender.effectCounters.nextTurnPriority = true;
                this.log(`高伤下回合先手: 伤害 ${context.damage} > ${threshold}`, 'info');
                results.push(this.createResult(true, 'defender', 'high_damage_next_priority', `下回合必定先手`, 0, { threshold, damage: context.damage }));
            }
        }
        else if (context.timing === EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK) {
            const attacker = this.getAttacker(context);
            if (attacker.effectCounters?.nextTurnPriority) {
                context.alwaysFirst = true;
                context.priorityModifier += 999;
                attacker.effectCounters.nextTurnPriority = false;
                results.push(this.createResult(true, 'attacker', 'next_turn_priority', `${attacker.name} 先手发动`, 0));
            }
        }
        return results;
    }
}
exports.HighDamageNextPriorityPassive = HighDamageNextPriorityPassive;
//# sourceMappingURL=PriorityPassives.js.map