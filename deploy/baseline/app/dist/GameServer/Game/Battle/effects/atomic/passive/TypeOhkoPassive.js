"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypeOhkoPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 属性秒杀 (2205)
 * 遇到指定精灵属性，所有技能必定秒杀
 * effectArgs: [type1, type2, ..., type8]
 */
class TypeOhkoPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'TypeOhkoPassive', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const targetTypes = (context.effectArgs || []).filter(t => t > 0);
        if (targetTypes.includes(defender.type)) {
            context.instantKill = true;
            context.damage = defender.hp;
            this.log(`属性秒杀: 目标属性 ${defender.type} 在秒杀列表中`, 'info');
            results.push(this.createResult(true, 'attacker', 'instant_kill', `对属性 ${defender.type} 发动秒杀`, defender.hp, { targetTypes, defenderType: defender.type }));
        }
        return results;
    }
}
exports.TypeOhkoPassive = TypeOhkoPassive;
//# sourceMappingURL=TypeOhkoPassive.js.map