"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeDamageBonusPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 属性伤害加成 (2028)
 * XX系技能伤害增加n%
 * effectArgs: [elementType, bonusPercent]
 */
class TypeDamageBonusPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'TypeDamageBonusPassive', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const elementType = context.effectArgs?.[0] || 0;
        const bonusPercent = context.effectArgs?.[1] || 0;
        if (context.skillType === elementType && bonusPercent > 0) {
            context.damageMultiplier *= (1 + bonusPercent / 100);
            this.log(`属性伤害加成: 属性${elementType} 伤害+${bonusPercent}%`, 'info');
            results.push(this.createResult(true, 'attacker', 'type_damage_bonus', `${elementType}系技能伤害增加 ${bonusPercent}%`, bonusPercent, { elementType, bonusPercent }));
        }
        return results;
    }
}
exports.TypeDamageBonusPassive = TypeDamageBonusPassive;
//# sourceMappingURL=TypeDamageBonusPassive.js.map