"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlatStatBonusPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 固定属性加成 (2026)
 * 给一种battle_attr增加固定n点属性值
 * effectArgs: [attrType, value]
 * attrType: 0=attack, 1=defence, 2=spAtk, 3=spDef, 4=speed
 */
class FlatStatBonusPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'FlatStatBonusPassive', [EffectContext_1.EffectTiming.BATTLE_START]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const attrType = context.effectArgs?.[0] || 0;
        const value = context.effectArgs?.[1] || 0;
        if (value > 0) {
            const attrMap = {
                0: 'attack',
                1: 'defence',
                2: 'spAtk',
                3: 'spDef',
                4: 'speed',
            };
            const attrName = attrMap[attrType];
            if (attrName) {
                attacker[attrName] = (attacker[attrName] || 0) + value;
                this.log(`固定属性加成: ${attacker.name} ${attrName} +${value}`, 'info');
                results.push(this.createResult(true, 'attacker', 'flat_stat_bonus', `${attacker.name} ${attrName} 增加 ${value}`, value, { attrType, attrName }));
            }
        }
        return results;
    }
}
exports.FlatStatBonusPassive = FlatStatBonusPassive;
//# sourceMappingURL=FlatStatBonusPassive.js.map