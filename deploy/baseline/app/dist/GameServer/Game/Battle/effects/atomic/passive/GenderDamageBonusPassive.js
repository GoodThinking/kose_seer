"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenderDamageBonusPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 性别伤害加成 (2069)
 * 目标为n性别时，所有攻击伤害增加m%
 * effectArgs: [gender, bonusPercent]
 */
class GenderDamageBonusPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'GenderDamageBonusPassive', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const gender = context.effectArgs?.[0] || 0;
        const bonusPercent = context.effectArgs?.[1] || 0;
        // 检查目标性别（通过effectCounters存储）
        const defenderGender = defender.effectCounters?.gender || 0;
        if (bonusPercent > 0 && defenderGender === gender) {
            context.damageMultiplier *= (1 + bonusPercent / 100);
            this.log(`性别伤害加成: 目标性别${gender}, 伤害+${bonusPercent}%`, 'info');
            results.push(this.createResult(true, 'attacker', 'gender_damage_bonus', `对指定性别目标伤害增加 ${bonusPercent}%`, bonusPercent, { gender, bonusPercent }));
        }
        return results;
    }
}
exports.GenderDamageBonusPassive = GenderDamageBonusPassive;
//# sourceMappingURL=GenderDamageBonusPassive.js.map