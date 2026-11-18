"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DamageFloor = void 0;
const BaseAtomicEffect_1 = require("./core/BaseAtomicEffect");
const IAtomicEffect_1 = require("./core/IAtomicEffect");
/**
 * 伤害下限原子效果
 *
 * 确保造成的伤害不低于指定值
 *
 * @category Special
 */
class DamageFloor extends BaseAtomicEffect_1.BaseAtomicEffect {
    minDamage;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'DamageFloor', []);
        this.minDamage = params.minDamage || 1;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { damage } = context;
        // 只在伤害计算后应用
        if (damage !== undefined && damage > 0 && damage < this.minDamage) {
            const oldDamage = damage;
            context.damage = this.minDamage;
            return [this.createResult(true, 'attacker', 'damage_floor', `伤害提升至最小值${this.minDamage}`, this.minDamage - oldDamage, {
                    oldDamage,
                    newDamage: this.minDamage,
                    increase: this.minDamage - oldDamage
                })];
        }
        return [this.createResult(false, 'attacker', 'damage_floor', '伤害正常')];
    }
}
exports.DamageFloor = DamageFloor;
//# sourceMappingURL=DamageFloor.js.map