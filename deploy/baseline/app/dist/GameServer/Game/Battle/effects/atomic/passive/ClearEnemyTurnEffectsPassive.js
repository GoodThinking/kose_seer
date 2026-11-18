"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClearEnemyTurnEffectsPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 命中消回合效果 (2772)
 * 技能命中前消除对手回合类效果
 */
class ClearEnemyTurnEffectsPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'ClearEnemyTurnEffectsPassive', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        // 清除对手的回合类效果
        if (defender.effectCounters) {
            const turnEffectKeys = Object.keys(defender.effectCounters).filter(key => key.includes('Turns') || key.includes('turns') || key.includes('duration'));
            for (const key of turnEffectKeys) {
                defender.effectCounters[key] = 0;
            }
            if (turnEffectKeys.length > 0) {
                this.log(`命中消回合效果: 清除 ${defender.name} 的 ${turnEffectKeys.length} 个回合效果`, 'info');
                results.push(this.createResult(true, 'defender', 'clear_turn_effects', `清除了 ${defender.name} 的回合类效果`, turnEffectKeys.length, { clearedKeys: turnEffectKeys }));
            }
        }
        return results;
    }
}
exports.ClearEnemyTurnEffectsPassive = ClearEnemyTurnEffectsPassive;
//# sourceMappingURL=ClearEnemyTurnEffectsPassive.js.map