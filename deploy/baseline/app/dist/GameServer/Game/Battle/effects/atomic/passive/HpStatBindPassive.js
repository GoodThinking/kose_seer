"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HpStatBindPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 血量绑定能力 (2016)
 * HP与battle_lv的某一种绑定，自身体力每减少1/8则该battle_lv上升1个等级，最高到12
 * effectArgs: [statIndex]
 */
class HpStatBindPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'HpStatBindPassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        const statIndex = context.effectArgs?.[0] || 0;
        if (context.damage > 0 && defender.battleLv && defender.maxHp > 0) {
            // 计算已损失HP对应的等级
            const hpLostRatio = (defender.maxHp - defender.hp) / defender.maxHp;
            const targetLevel = Math.min(12, Math.floor(hpLostRatio * 8) + 6);
            const currentLevel = defender.battleLv[statIndex] || 6;
            if (targetLevel > currentLevel) {
                defender.battleLv[statIndex] = targetLevel;
                this.log(`血量绑定能力: ${defender.name} 能力${statIndex} -> ${targetLevel}`, 'info');
                results.push(this.createResult(true, 'defender', 'hp_stat_bind', `${defender.name} 能力等级提升至 ${targetLevel}`, targetLevel - currentLevel, { statIndex, hpLostRatio, targetLevel }));
            }
        }
        return results;
    }
}
exports.HpStatBindPassive = HpStatBindPassive;
//# sourceMappingURL=HpStatBindPassive.js.map