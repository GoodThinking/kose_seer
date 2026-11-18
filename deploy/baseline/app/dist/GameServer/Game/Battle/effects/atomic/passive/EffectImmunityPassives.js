"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillEffectImmunityPassive = exports.EffectImmunityPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 免疫特效 (2050)
 * 免疫某类特效
 * effectArgs: [effectId1, effectId2, ..., effectId8]
 */
class EffectImmunityPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'EffectImmunityPassive', [EffectContext_1.EffectTiming.BATTLE_START]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const immuneEffects = (context.effectArgs || []).filter(id => id > 0);
        if (immuneEffects.length > 0) {
            if (!attacker.effectCounters)
                attacker.effectCounters = {};
            attacker.effectCounters.immuneEffects = immuneEffects;
            this.log(`免疫特效: ${attacker.name} 免疫效果 [${immuneEffects.join(',')}]`, 'info');
            results.push(this.createResult(true, 'attacker', 'effect_immunity', `${attacker.name} 免疫指定特效`, 0, { immuneEffects }));
        }
        return results;
    }
}
exports.EffectImmunityPassive = EffectImmunityPassive;
/**
 * 免疫指定技能特效 (2185)
 * 免疫指定技能的特效
 * effectArgs: [skillId1, skillId2, ..., skillId8]
 */
class SkillEffectImmunityPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'SkillEffectImmunityPassive', [EffectContext_1.EffectTiming.BATTLE_START]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const immuneSkills = (context.effectArgs || []).filter(id => id > 0);
        if (immuneSkills.length > 0) {
            if (!attacker.effectCounters)
                attacker.effectCounters = {};
            attacker.effectCounters.immuneSkillEffects = immuneSkills;
            this.log(`免疫指定技能特效: ${attacker.name} 免疫技能 [${immuneSkills.join(',')}] 的特效`, 'info');
            results.push(this.createResult(true, 'attacker', 'skill_effect_immunity', `${attacker.name} 免疫指定技能特效`, 0, { immuneSkills }));
        }
        return results;
    }
}
exports.SkillEffectImmunityPassive = SkillEffectImmunityPassive;
//# sourceMappingURL=EffectImmunityPassives.js.map