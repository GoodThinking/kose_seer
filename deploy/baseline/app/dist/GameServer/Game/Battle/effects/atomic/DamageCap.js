"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DamageCap = void 0;
const BaseAtomicEffect_1 = require("./core/BaseAtomicEffect");
const IAtomicEffect_1 = require("./core/IAtomicEffect");
/**
 * 伤害上限原子效果
 *
 * 持续N回合，每回合受到的伤害不超过指定值
 *
 * @category Special
 */
class DamageCap extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    maxDamage;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'DamageCap', []);
        this.duration = params.duration || 3;
        this.maxDamage = params.maxDamage || 100;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { damage } = context;
        // 在伤害计算后检查并限制最大值
        if (damage !== undefined && damage > this.maxDamage) {
            const oldDamage = damage;
            context.damage = this.maxDamage;
            return [this.createResult(true, 'defender', 'damage_cap', `伤害限制至${this.maxDamage}点`, this.maxDamage - oldDamage, {
                    originalDamage: oldDamage,
                    cappedDamage: this.maxDamage,
                    reduction: oldDamage - this.maxDamage,
                    duration: this.duration
                })];
        }
        return [this.createResult(false, 'defender', 'damage_cap', '伤害未超过上限')];
    }
}
exports.DamageCap = DamageCap;
//# sourceMappingURL=DamageCap.js.map