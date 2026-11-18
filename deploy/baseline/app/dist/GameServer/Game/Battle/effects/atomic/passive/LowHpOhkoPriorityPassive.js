"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowHpOhkoPriorityPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 低血秒杀先制 (2023)
 * 自身体力降到N%以下时，先制+6且每次攻击必定秒杀对方
 * effectArgs: [thresholdHigh, thresholdLow]
 */
class LowHpOhkoPriorityPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'LowHpOhkoPriorityPassive', [EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK, EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const thresholdHigh = context.effectArgs?.[0] || 0;
        const thresholdLow = context.effectArgs?.[1] || 0;
        // 确定是否低于阈值
        let belowThreshold;
        let threshold;
        if (thresholdHigh === 0 && thresholdLow > 0 && thresholdLow <= 100) {
            // 百分比模式: args=[0, 50] → hp * 2 < maxHp（原版条件）
            // 使用乘法避免整除误差：hp * (100/percent) < maxHp
            threshold = thresholdLow;
            belowThreshold = attacker.hp * 100 < attacker.maxHp * thresholdLow;
        }
        else {
            // 固定HP模式: args=[high, low] → HP < (high << 16 | low)
            threshold = (thresholdHigh << 16) | thresholdLow;
            belowThreshold = attacker.hp < threshold;
        }
        if (attacker.hp > 0 && belowThreshold) {
            if (context.timing === EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK) {
                context.priorityModifier += 6;
                results.push(this.createResult(true, 'attacker', 'low_hp_ohko', `${attacker.name} 低血先制+6`, 6, { threshold }));
            }
            else if (context.timing === EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC) {
                const defender = this.getDefender(context);
                context.instantKill = true;
                context.damage = defender.hp;
                this.log(`低血秒杀先手: ${attacker.name} HP=${attacker.hp}, 低于阈值${threshold}%, 秒杀`, 'info');
                results.push(this.createResult(true, 'attacker', 'instant_kill', `${attacker.name} 发动秒杀`, defender.hp, { threshold }));
            }
        }
        return results;
    }
}
exports.LowHpOhkoPriorityPassive = LowHpOhkoPriorityPassive;
//# sourceMappingURL=LowHpOhkoPriorityPassive.js.map