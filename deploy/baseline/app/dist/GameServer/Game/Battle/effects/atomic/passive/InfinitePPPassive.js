"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfinitePPPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 无限PP (2010)
 * 无限PP值 - 战斗开始时设置标志，每回合开始恢复PP
 */
class InfinitePPPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'InfinitePPPassive', [EffectContext_1.EffectTiming.BATTLE_START, EffectContext_1.EffectTiming.TURN_START]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        if (!attacker.effectCounters)
            attacker.effectCounters = {};
        attacker.effectCounters.infinitePP = true;
        // 每回合恢复PP到满
        if (attacker.skillPP) {
            for (let i = 0; i < attacker.skillPP.length; i++) {
                attacker.skillPP[i] = 99;
            }
        }
        if (context.timing === EffectContext_1.EffectTiming.BATTLE_START) {
            this.log(`${attacker.name} 获得无限PP`, 'info');
            results.push(this.createResult(true, 'attacker', 'infinite_pp', `${attacker.name} 获得无限PP`, 0));
        }
        return results;
    }
}
exports.InfinitePPPassive = InfinitePPPassive;
//# sourceMappingURL=InfinitePPPassive.js.map