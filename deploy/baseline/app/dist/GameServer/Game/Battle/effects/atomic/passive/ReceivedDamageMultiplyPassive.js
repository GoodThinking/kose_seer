"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceivedDamageMultiplyPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 受击伤害倍增 (2022)
 * 被打时受到直接攻击伤害提高至n倍
 * effectArgs: [multiplier]
 */
class ReceivedDamageMultiplyPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'ReceivedDamageMultiplyPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const multiplier = context.effectArgs?.[0] || 2;
        if (context.damage > 0 && multiplier > 1) {
            const oldDamage = context.damage;
            context.damage = Math.floor(context.damage * multiplier);
            this.log(`受击伤害倍增: ${oldDamage} -> ${context.damage} (x${multiplier})`, 'info');
            results.push(this.createResult(true, 'defender', 'received_damage_multiply', `受到伤害提高至 ${multiplier} 倍`, context.damage - oldDamage, { multiplier, oldDamage }));
        }
        return results;
    }
}
exports.ReceivedDamageMultiplyPassive = ReceivedDamageMultiplyPassive;
//# sourceMappingURL=ReceivedDamageMultiplyPassive.js.map