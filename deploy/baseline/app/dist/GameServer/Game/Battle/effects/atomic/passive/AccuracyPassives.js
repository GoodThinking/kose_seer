"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccuracyBonusPassive = exports.SkillDodgePassive = exports.AccuracyReductionPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 闪避提升 (2007)
 * 任何技能对自身的命中率下降n%
 * effectArgs: [reducePercent]
 */
class AccuracyReductionPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'AccuracyReductionPassive', [EffectContext_1.EffectTiming.BEFORE_HIT_CHECK]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const reducePercent = context.effectArgs?.[0] || 0;
        if (reducePercent > 0) {
            context.hitRateModifier -= reducePercent;
            this.log(`闪避提升: 命中率降低 ${reducePercent}%`, 'info');
            results.push(this.createResult(true, 'defender', 'accuracy_reduction', `命中率降低 ${reducePercent}%`, reducePercent));
        }
        return results;
    }
}
exports.AccuracyReductionPassive = AccuracyReductionPassive;
/**
 * 技能闪避 (2024)
 * 对方用这些技能时，对自身的命中率为0
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
class SkillDodgePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'SkillDodgePassive', [EffectContext_1.EffectTiming.BEFORE_HIT_CHECK]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const dodgeSkills = (context.effectArgs || []).filter(id => id > 0);
        if (dodgeSkills.includes(context.skillId)) {
            context.hitRateModifier = -100;
            context.isMiss = true;
            this.log(`技能闪避: 技能 ${context.skillId} 被完全闪避`, 'info');
            results.push(this.createResult(true, 'defender', 'skill_dodge', `完全闪避了技能 ${context.skillId}`, 0, { skillId: context.skillId }));
        }
        return results;
    }
}
exports.SkillDodgePassive = SkillDodgePassive;
/**
 * 命中率提升 (2029)
 * 自身的所有技能命中率增加n%
 * effectArgs: [bonusPercent]
 */
class AccuracyBonusPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'AccuracyBonusPassive', [EffectContext_1.EffectTiming.BEFORE_HIT_CHECK]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const bonusPercent = context.effectArgs?.[0] || 0;
        if (bonusPercent > 0) {
            context.hitRateModifier += bonusPercent;
            this.log(`命中率提升: 命中率增加 ${bonusPercent}%`, 'info');
            results.push(this.createResult(true, 'attacker', 'accuracy_bonus', `命中率增加 ${bonusPercent}%`, bonusPercent));
        }
        return results;
    }
}
exports.AccuracyBonusPassive = AccuracyBonusPassive;
//# sourceMappingURL=AccuracyPassives.js.map