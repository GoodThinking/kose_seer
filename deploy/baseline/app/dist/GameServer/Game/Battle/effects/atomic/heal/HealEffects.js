"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Regeneration = exports.HealReversal = exports.HealEffect = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 回复效果原子效果
 * 计算回复结果，由EffectApplicator统一修改目标HP
 *
 * @example
 * // 回复自身最大HP的50%
 * { type: 'heal', target: 'self', mode: 'percent', value: 0.5 }
 *
 * // 回复固定100点HP
 * { type: 'heal', target: 'self', mode: 'fixed', value: 100 }
 *
 * // 回复造成伤害的50%
 * { type: 'heal', target: 'self', mode: 'damage_percent', value: 0.5 }
 */
class HealEffect extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.HEAL, 'Heal Effect', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const target = this.getTarget(context, this.params.target);
        if (!target)
            return results;
        let healAmount = 0;
        if (this.params.mode === 'percent') {
            healAmount = Math.floor(target.maxHp * this.params.value);
        }
        else if (this.params.mode === 'fixed') {
            healAmount = this.params.value;
        }
        else if (this.params.mode === 'damage_percent' && context.damage) {
            healAmount = Math.floor(context.damage * this.params.value);
        }
        else if (this.params.mode === 'max_hp_divisor') {
            // SideEffect43's value is the denominator n, not a percentage.
            if (!Number.isInteger(this.params.value) || this.params.value <= 0)
                return results;
            healAmount = Math.floor(target.maxHp / this.params.value);
        }
        const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
        if (actualHeal > 0) {
            // Every production caller applies this result through EffectApplicator.
            // Mutating HP here too would heal twice but report only one gain in 2505.
            results.push(this.createResult(true, this.params.target === 'self' ? 'attacker' : 'defender', 'heal', `回复${actualHeal}HP`, actualHeal, {healMode: this.params.mode}));
        }
        return results;
    }
    validate(params) {
        return params && params.type === IAtomicEffect_1.AtomicEffectType.HEAL &&
            ['self', 'opponent'].includes(params.target) &&
            ['percent', 'fixed', 'damage_percent', 'max_hp_divisor'].includes(params.mode) &&
            typeof params.value === 'number' &&
            (params.mode !== 'max_hp_divisor' || (Number.isInteger(params.value) && params.value > 0));
    }
}
exports.HealEffect = HealEffect;
/**
 * 回复反转效果
 *
 * 功能：
 * - 将回复效果转换为伤害
 * - 可设置持续回合数或永久生效
 * - 可选择是否反转吸血效果
 *
 * 使用场景：
 * - 治疗封印（回复变成伤害）
 * - 诅咒状态（无法回复HP）
 * - 反转领域（所有回复效果反转）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "heal_reversal",
 *   "duration": 5,
 *   "reverseDrain": true
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   remainingTurns?: number;    // 剩余回合数
 *   isActive: boolean;          // 是否激活
 *   reverseDrain: boolean;      // 是否反转吸血
 * }
 * ```
 */
class HealReversal extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    reverseDrain;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'HealReversal', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.ON_HP_CHANGE, EffectContext_1.EffectTiming.TURN_END]);
        this.duration = params.duration;
        this.reverseDrain = params.reverseDrain ?? true;
    }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        // 在AFTER_SKILL时机激活反转
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            const reversalState = this.getReversalState(defender);
            reversalState.isActive = true;
            reversalState.reverseDrain = this.reverseDrain;
            if (this.duration !== undefined) {
                reversalState.remainingTurns = this.duration;
            }
            results.push(this.createResult(true, 'defender', 'heal_reversal_activate', `回复反转激活！回复将变成伤害`, 0, { duration: this.duration }));
            this.log(`回复反转激活: 持续${this.duration ?? '永久'}回合`);
        }
        // 在ON_HP_CHANGE时机拦截回复
        if (context.timing === EffectContext_1.EffectTiming.ON_HP_CHANGE) {
            const reversalState = this.getReversalState(defender);
            if (reversalState.isActive) {
                // 这里需要在实际的HP变化逻辑中实现反转
                // 此处仅作为标记，实际反转逻辑需要在HP变化处理中检查此状态
                results.push(this.createResult(true, 'defender', 'heal_reversal_check', `回复反转生效中`, 0));
            }
        }
        // 在TURN_END时机检查持续时间
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            const reversalState = this.getReversalState(defender);
            if (reversalState.isActive && reversalState.remainingTurns !== undefined) {
                reversalState.remainingTurns--;
                if (reversalState.remainingTurns <= 0) {
                    // 反转结束
                    reversalState.isActive = false;
                    results.push(this.createResult(true, 'defender', 'heal_reversal_end', `回复反转结束了！`, 0));
                    this.log(`回复反转结束`);
                }
            }
        }
        return results;
    }
    validate(params) {
        if (params.duration !== undefined && params.duration < 1) {
            this.log('duration必须至少为1', 'error');
            return false;
        }
        return true;
    }
    /**
     * 获取反转状态
     */
    getReversalState(pet) {
        if (!pet.effectStates) {
            pet.effectStates = {};
        }
        if (!pet.effectStates.healReversal) {
            pet.effectStates.healReversal = {
                isActive: false,
                reverseDrain: true
            };
        }
        return pet.effectStates.healReversal;
    }
}
exports.HealReversal = HealReversal;
/**
 * 持续回复原子效果
 * 每回合回复一定比例或固定值的HP
 *
 * @example
 * // 每回合回复最大HP的1/16，持续5回合
 * { type: 'special', specialType: 'regeneration', target: 'self', duration: 5, healRatio: 0.0625 }
 *
 * // 每回合回复50HP，持续3回合
 * { type: 'special', specialType: 'regeneration', target: 'self', duration: 3, healAmount: 50 }
 */
class Regeneration extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Regeneration', [EffectContext_1.EffectTiming.TURN_END]);
        this.params = params;
    }
    execute(context) {
        const results = [];
        const target = this.getTarget(context, this.params.target);
        if (!target)
            return results;
        let healAmount = 0;
        if (this.params.healRatio !== undefined) {
            healAmount = Math.floor(target.maxHp * this.params.healRatio);
        }
        else if (this.params.healAmount !== undefined) {
            healAmount = this.params.healAmount;
        }
        else {
            healAmount = Math.floor(target.maxHp / 16);
        }
        healAmount = Math.max(1, healAmount);
        const actualHeal = Math.min(healAmount, target.maxHp - target.hp);
        if (actualHeal > 0) {
            if (__universeBudget.battleFor(target)) { __ubHeal(target, actualHeal, 'atomic-regeneration', false); } else { target.hp += actualHeal; }
            results.push(this.createResult(true, this.params.target === 'self' ? 'attacker' : 'defender', 'regeneration', `回复了${actualHeal}点HP`, actualHeal));
        }
        return results;
    }
    validate(params) {
        return params && params.type === IAtomicEffect_1.AtomicEffectType.SPECIAL &&
            params.specialType === 'regeneration' &&
            ['self', 'opponent'].includes(params.target) &&
            typeof params.duration === 'number' && params.duration >= 1;
    }
}
exports.Regeneration = Regeneration;
//# sourceMappingURL=HealEffects.js.map
const __universeBudget = require('../../../UniverseBossBudget');
function __ubHeal(pet, amount, source, active = false) {
    const b = __universeBudget.battleFor(pet);
    if (b) return __universeBudget.heal(b, pet, amount, {active, source});
    const old = pet.hp;
    pet.hp = Math.min(pet.maxHp, pet.hp + amount);
    return pet.hp - old;
}
function __ubDamage(source, pet, amount, kind) {
    const b = __universeBudget.battleFor(pet);
    const actual = Math.min(pet.hp, __universeBudget.damage(b, source, pet, kind, amount));
    pet.hp = Math.max(0, pet.hp - actual);
    return actual;
}
function __ubReflect(attacker, defender, amount, source) {
    const b = __universeBudget.battleFor(defender) || __universeBudget.battleFor(attacker);
    if (b) return __universeBudget.reflect(b, attacker, defender, amount, source);
    const actual = Math.min(attacker.hp, amount);
    attacker.hp = Math.max(0, attacker.hp - actual);
    return actual;
}
function __ubBlocked(target, status, source) {
    const b = __universeBudget.battleFor(target);
    if (!b || target !== b.enemy) return false;
    source = source || b.universeBudgetState?.actor;
    if (source === target && status === 7) b.universeBudgetState.selfFatigue = true;
    return source !== target && [0, 6, 7, 8, 9, 15].includes(status) && __universeBudget.controlResistant(b);
}
function __ubFatal(target) {
    const b = __universeBudget.battleFor(target);
    return !!(b && target === b.enemy);
}
