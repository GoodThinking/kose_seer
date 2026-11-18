"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusImmunityPassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 免疫异常状态被动效果
 * BOSS特性2: 免疫所有异常状态（麻痹、中毒、烧伤、冻伤、睡眠、害怕等）
 *
 * 实现方式：
 * - 在战斗开始时设置 immuneFlags.status = true
 * - 战斗系统在施加异常状态时检查此标志，阻止状态施加
 */
class StatusImmunityPassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor() {
        super('immunity', 'StatusImmunityPassive', [EffectContext_1.EffectTiming.BATTLE_START]);
    }
    validate(params) {
        return true; // 无参数，总是有效
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        // 在战斗开始时设置免疫标志
        if (context.timing === EffectContext_1.EffectTiming.BATTLE_START) {
            if (!attacker.immuneFlags) {
                attacker.immuneFlags = {};
            }
            attacker.immuneFlags.status = true;
            this.log(`精灵 ${attacker.name} 获得异常状态免疫`, 'info');
            results.push(this.createResult(true, 'attacker', 'immunity', `${attacker.name} 免疫异常状态`, 0, { immuneType: 'status' }));
        }
        return results;
    }
}
exports.StatusImmunityPassive = StatusImmunityPassive;
//# sourceMappingURL=StatusImmunityPassive.js.map