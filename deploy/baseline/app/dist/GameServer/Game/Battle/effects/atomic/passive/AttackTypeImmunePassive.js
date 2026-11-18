"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttackTypeImmunePassive = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 攻击类型无效 (2048)
 * 对方某种攻击类型无效
 * effectArgs: [attackType] (1=物理, 2=特殊, 3=变化)
 */
class AttackTypeImmunePassive extends BaseAtomicEffect_1.BaseAtomicEffect {
    constructor(params = {}) {
        super('special', 'AttackTypeImmunePassive', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC]);
    }
    validate(params) { return true; }
    execute(context) {
        const results = [];
        const attackType = context.effectArgs?.[0] || 0;
        if (attackType > 0 && context.skillCategory === attackType) {
            context.damage = 0;
            context.isBlocked = true;
            this.log(`攻击类型无效: 类型 ${attackType} 被免疫`, 'info');
            results.push(this.createResult(true, 'defender', 'attack_type_immune', `免疫了该类型的攻击`, 0, { attackType }));
        }
        return results;
    }
}
exports.AttackTypeImmunePassive = AttackTypeImmunePassive;
//# sourceMappingURL=AttackTypeImmunePassive.js.map