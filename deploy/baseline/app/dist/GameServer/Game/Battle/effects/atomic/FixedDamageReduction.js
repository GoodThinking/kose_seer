"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FixedDamageReduction = void 0;
const BaseAtomicEffect_1 = require("./core/BaseAtomicEffect");
const IAtomicEffect_1 = require("./core/IAtomicEffect");
/**
 * 固定伤害减免原子效果
 *
 * 持续N回合，每回合受到的伤害减少固定值
 *
 * @category Special
 */
class FixedDamageReduction extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    reduction;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'FixedDamageReduction', []);
        this.duration = params.duration || 3;
        this.reduction = params.reduction || 50;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { damage } = context;
        // 在伤害应用前减少固定值
        if (damage !== undefined && damage > 0) {
            const actualReduction = Math.min(damage, this.reduction);
            context.damage = Math.max(0, damage - actualReduction);
            return [this.createResult(true, 'defender', 'fixed_damage_reduction', `伤害减少${actualReduction}点`, -actualReduction, {
                    originalDamage: damage,
                    reducedDamage: context.damage,
                    reduction: actualReduction,
                    duration: this.duration
                })];
        }
        return [this.createResult(false, 'defender', 'fixed_damage_reduction', '无伤害需要减免')];
    }
}
exports.FixedDamageReduction = FixedDamageReduction;
//# sourceMappingURL=FixedDamageReduction.js.map