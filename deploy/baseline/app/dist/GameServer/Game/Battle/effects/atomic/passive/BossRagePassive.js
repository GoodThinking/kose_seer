"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BossRagePassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 魔王愤怒 (2058)
 * 按一定条件触发魔王的愤怒，触发时战斗等级提升至一定状态
 * effectArgs: [atkLevel, defLevel, spAtkLevel, spDefLevel, spdLevel, accLevel]
 * -1表示不设置
 */
class BossRagePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'BossRagePassive', [EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        if (!defender.effectCounters)
            defender.effectCounters = {};
        if (defender.effectCounters.bossRageTriggered)
            return results;
        // 触发条件：HP低于50%
        if (defender.hp > 0 && defender.maxHp > 0 && defender.hp < defender.maxHp * 0.5) {
            const levels = context.effectArgs || [];
            if (defender.battleLv) {
                for (let i = 0; i < 6 && i < levels.length; i++) {
                    if (levels[i] >= 0) {
                        defender.battleLv[i] = levels[i];
                    }
                }
            }
            defender.effectCounters.bossRageTriggered = true;
            this.log(`魔王愤怒: ${defender.name} 触发愤怒，能力等级提升`, 'info');
            results.push(this.createResult(true, 'defender', 'boss_rage', `${defender.name} 触发了魔王愤怒！`, 0, { levels: levels.slice(0, 6) }));
        }
        return results;
    }
}
exports.BossRagePassive = BossRagePassive;
//# sourceMappingURL=BossRagePassive.js.map