"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RandomHpLoss = exports.Mercy = exports.MaxHpModifier = exports.HpEqual = exports.HpCost = exports.DelayedFullHeal = exports.SelectiveHeal = exports.DamageToHp = exports.Absorb = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
const BossSpecialRules_1 = require("../../../BossSpecialRules");
/**
 * 吸血效果 (Absorb)
 *
 * 根据造成的伤害回复自己的HP。
 * 可以设置最小和最大回复量。
 *
 * **功能：**
 * - 基于伤害的百分比回复
 * - 设置最小回复量（保底）
 * - 设置最大回复量（上限）
 * - 不能超过最大HP
 *
 * **使用场景：**
 *
 * 1. **吸血类技能（Effect_12）**
 *    - 回复造成伤害的50%
 *    - 例如：造成100伤害，回复50 HP
 *
 * 2. **终极吸取**
 *    - 回复造成伤害的75%
 *    - 例如：造成120伤害，回复90 HP
 *
 * 3. **吸血鬼之牙**
 *    - 回复造成伤害的100%
 *    - 最少回复10 HP
 *
 * 4. **生命汲取**
 *    - 回复造成伤害的50%
 *    - 最多回复100 HP
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Absorb",
 *   "timing": "AFTER_DAMAGE_APPLY",
 *   "params": {
 *     "percent": 0.5,
 *     "minHeal": 1,
 *     "maxHeal": 999
 *   }
 * }
 * ```
 *
 * @category Special
 */
class Absorb extends BaseAtomicEffect_1.BaseAtomicEffect {
    percent;
    minHeal;
    maxHeal;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Absorb', []);
        this.percent = params.percent;
        this.minHeal = params.minHeal || 0;
        this.maxHeal = params.maxHeal || 999;
    }
    validate(params) {
        return params && params.percent !== undefined;
    }
    execute(context) {
        const { attacker, damage } = context;
        // 如果没有造成伤害，不吸血
        if (damage <= 0) {
            return [this.createResult(false, 'attacker', 'absorb', '吸血失败：未造成伤害')];
        }
        // 计算吸血量
        let healAmount = Math.floor(damage * this.percent);
        // 应用最小和最大限制
        healAmount = Math.max(this.minHeal, Math.min(this.maxHeal, healAmount));
        // 回复HP（不能超过最大HP）
        const oldHp = attacker.hp;
        if (__universeBudget.battleFor(attacker)) __ubHeal(attacker, healAmount, 'absorb', false); else attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
        const actualHeal = attacker.hp - oldHp;
        if (actualHeal > 0) {
            return [this.createResult(true, 'attacker', 'absorb', `吸血：回复${actualHeal} HP`, actualHeal, {
                    universeAlreadyApplied: true,
                    healAmount: actualHeal,
                    percent: this.percent,
                    baseDamage: damage,
                    remainingHp: attacker.hp
                })];
        }
        return [this.createResult(false, 'attacker', 'absorb', '吸血失败：HP已满')];
    }
}
exports.Absorb = Absorb;
/**
 * 伤害转化为体力效果
 *
 * 持续N回合，受到的伤害转化为自身HP
 *
 * @category Special
 */
class DamageToHp extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    conversionRatio;
    // 追踪每个精灵的光环状态
    auras = new Map();
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'DamageToHp', []);
        this.duration = params.duration || 3;
        this.conversionRatio = params.conversionRatio || 1.0;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker } = context;
        // 创建光环
        this.auras.set(attacker.id, {
            duration: this.duration,
            remainingTurns: this.duration,
            conversionRatio: this.conversionRatio
        });
        return [this.createResult(true, 'attacker', 'damage_to_hp', `伤害转化为体力光环（${this.duration}回合）`, this.duration, {
                duration: this.duration,
                conversionRatio: this.conversionRatio
            })];
    }
    /**
     * 受到伤害时触发
     */
    onDamageTaken(petId, pet, damage) {
        const aura = this.auras.get(petId);
        if (!aura)
            return [];
        // 将伤害转化为HP
        const healAmount = Math.floor(damage * aura.conversionRatio);
        if (__universeBudget.battleFor(pet)) { __ubHeal(pet, healAmount, 'damage-to-hp', false); } else { pet.hp = Math.min(pet.maxHp, pet.hp + healAmount); }
        return [this.createResult(true, 'attacker', 'damage_to_hp_trigger', `伤害转化为体力 +${healAmount}HP`, healAmount, {
                damage,
                healAmount,
                conversionRatio: aura.conversionRatio
            })];
    }
    /**
     * 每回合结束时触发
     */
    onTurnEnd(petId) {
        const aura = this.auras.get(petId);
        if (aura) {
            aura.remainingTurns--;
            if (aura.remainingTurns <= 0) {
                this.auras.delete(petId);
            }
        }
    }
    /**
     * 移除光环
     */
    removeAura(petId) {
        this.auras.delete(petId);
    }
}
exports.DamageToHp = DamageToHp;
/**
 * 选择目标回复效果
 *
 * 对选中对象或本方全体恢复体力
 *
 * @category Special
 * @example
 * // 选择目标回复
 * {
 *   healRatio: 0.5,
 *   targetSelection: 'self'
 * }
 */
class SelectiveHeal extends BaseAtomicEffect_1.BaseAtomicEffect {
    healRatio;
    targetSelection;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'SelectiveHeal', []);
        this.healRatio = params.healRatio;
        this.targetSelection = params.targetSelection;
    }
    validate(params) {
        return this.healRatio > 0;
    }
    execute(context) {
        const { attacker } = context;
        // 计算回复量
        const healAmount = Math.floor(attacker.maxHp * this.healRatio);
        // 应用回复
        const beforeHp = attacker.hp;
        if (__universeBudget.battleFor(attacker)) __ubHeal(attacker, healAmount, 'selective-heal', true); else attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
        const actualHeal = attacker.hp - beforeHp;
        return [this.createResult(actualHeal > 0, 'attacker', 'selective_heal', `选择目标回复（${actualHeal}HP）`, actualHeal, {
                healAmount: actualHeal,
                targetSelection: this.targetSelection
            })];
    }
}
exports.SelectiveHeal = SelectiveHeal;
/**
 * 延迟全回复效果
 *
 * 立刻恢复部分体力，延迟回合后恢复全部体力
 *
 * @category Special
 * @example
 * // 立即回复延迟全回复
 * {
 *   immediateHeal: 50,
 *   delayTurns: 3
 * }
 */
class DelayedFullHeal extends BaseAtomicEffect_1.BaseAtomicEffect {
    immediateHeal;
    delayTurns;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'DelayedFullHeal', []);
        this.immediateHeal = params.immediateHeal;
        this.delayTurns = params.delayTurns;
    }
    validate(params) {
        return this.immediateHeal >= 0 && this.delayTurns > 0;
    }
    execute(context) {
        const { attacker } = context;
        // 立即回复
        const beforeHp = attacker.hp;
        if (__universeBudget.battleFor(attacker)) { __ubHeal(attacker, this.immediateHeal, 'delayed-heal', true); } else { attacker.hp = Math.min(attacker.maxHp, attacker.hp + this.immediateHeal); }
        const actualHeal = attacker.hp - beforeHp;
        // 设置延迟全回复标记（需要在战斗系统中处理）
        if (!attacker.effectCounters) {
            attacker.effectCounters = {};
        }
        attacker.effectCounters['delayed_full_heal'] = this.delayTurns;
        return [this.createResult(true, 'attacker', 'delayed_full_heal', `立即回复${actualHeal}HP，${this.delayTurns}回合后全回复`, actualHeal, {
                immediateHeal: actualHeal,
                delayTurns: this.delayTurns
            })];
    }
}
exports.DelayedFullHeal = DelayedFullHeal;
/**
 * HP消耗效果
 *
 * 功能：
 * - 使用技能时消耗自己的HP
 * - 支持百分比或固定值消耗
 * - 可选择在技能使用前或后消耗
 * - 至少保留1HP
 *
 * 使用场景：
 * - 生命代价（使用技能消耗30%HP）
 * - 血之献祭（使用技能消耗100HP）
 * - 透支技能（技能使用后消耗50%HP）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "hp_cost",
 *   "mode": "percent",
 *   "cost": 30,
 *   "beforeSkill": true
 * }
 * ```
 *
 * 与Sacrifice的区别：
 * - Sacrifice: 消耗HP提升威力
 * - HpCost: 单纯消耗HP作为代价
 */
class HpCost extends BaseAtomicEffect_1.BaseAtomicEffect {
    mode;
    cost;
    beforeSkill;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'HpCost', [EffectContext_1.EffectTiming.BEFORE_SKILL, EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.mode = params.mode;
        this.cost = params.cost;
        this.beforeSkill = params.beforeSkill ?? true;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        if (!attacker) {
            this.log('HP消耗效果：攻击者不存在', 'warn');
            return results;
        }
        // 根据beforeSkill决定在哪个时机消耗HP
        const shouldExecute = (this.beforeSkill && context.timing === EffectContext_1.EffectTiming.BEFORE_SKILL) ||
            (!this.beforeSkill && context.timing === EffectContext_1.EffectTiming.AFTER_SKILL);
        if (!shouldExecute) {
            return results;
        }
        // 计算HP消耗
        let hpCost = 0;
        if (this.mode === 'percent') {
            hpCost = Math.floor(attacker.maxHp * (this.cost / 100));
        }
        else {
            hpCost = this.cost;
        }
        // 确保不会消耗超过当前HP-1（至少保留1HP）
        hpCost = Math.min(hpCost, attacker.hp - 1);
        hpCost = Math.max(0, hpCost);
        if (hpCost > 0) {
            if (__universeBudget.battleFor(attacker)) { __ubDamage(attacker, attacker, hpCost, 'other'); } else { attacker.hp -= hpCost; }
            results.push(this.createResult(true, 'attacker', 'hp_cost', `消耗${hpCost}HP`, hpCost, { mode: this.mode, cost: this.cost, beforeSkill: this.beforeSkill }));
            this.log(`HP消耗效果：消耗${hpCost}HP（${this.beforeSkill ? '技能前' : '技能后'}）`);
        }
        else {
            this.log('HP消耗效果：HP不足，无法消耗', 'warn');
        }
        return results;
    }
    validate(params) {
        if (!params.mode || !['percent', 'fixed'].includes(params.mode)) {
            this.log('HP消耗效果：mode必须是percent或fixed', 'error');
            return false;
        }
        if (typeof params.cost !== 'number' || params.cost <= 0) {
            this.log('HP消耗效果：cost必须是正数', 'error');
            return false;
        }
        if (params.mode === 'percent' && (params.cost < 0 || params.cost > 100)) {
            this.log('HP消耗效果：百分比模式下cost必须在0-100之间', 'error');
            return false;
        }
        return true;
    }
}
exports.HpCost = HpCost;
/**
 * 同生共死效果 (HpEqual)
 *
 * 使双方的HP变为相同值。
 * 可以选择不同的计算模式。
 *
 * **功能：**
 * - equal_to_self: 对手HP变为自己的HP
 * - equal_to_opponent: 自己HP变为对手的HP
 * - average: 双方HP变为平均值
 * - 可选择是否能超过最大HP
 *
 * **使用场景：**
 *
 * 1. **同生共死技能（Effect_41）**
 *    - 对手HP变为自己的HP
 *    - 例如：自己50 HP，对手200 HP → 对手变为50 HP
 *
 * 2. **生命共享**
 *    - 双方HP变为平均值
 *    - 例如：自己50 HP，对手200 HP → 双方都变为125 HP
 *
 * 3. **生命转移**
 *    - 自己HP变为对手的HP
 *    - 例如：自己50 HP，对手200 HP → 自己变为200 HP
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "HpEqual",
 *   "timing": "AFTER_SKILL",
 *   "params": {
 *     "mode": "equal_to_self",
 *     "canExceedMax": false
 *   }
 * }
 * ```
 *
 * @category Special
 */
class HpEqual extends BaseAtomicEffect_1.BaseAtomicEffect {
    mode;
    canExceedMax;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'HpEqual', []);
        this.mode = params.mode;
        this.canExceedMax = params.canExceedMax || false;
    }
    validate(params) {
        return params && params.mode;
    }
    execute(context) {
        const { attacker, defender } = context;
        // 同生共死免疫检查
        if (this.mode === 'equal_to_self' && __universeBudget.battleFor(defender)?.enemy !== defender && BossSpecialRules_1.BossSpecialRules.IsSameLifeDeathImmune(defender)) {
            return [this.createResult(false, 'both', 'hp_equal', '同生共死被免疫', 0)];
        }
        const oldAttackerHp = attacker.hp;
        const oldDefenderHp = defender.hp;
        let targetHp = 0;
        // 计算目标HP
        switch (this.mode) {
            case 'equal_to_self':
                targetHp = attacker.hp;
                if (__universeBudget.battleFor(defender)?.enemy === defender) { if (targetHp < defender.hp) __ubDamage(attacker, defender, defender.hp - targetHp, 'fraction'); else __ubHeal(defender, targetHp - defender.hp, 'hp-equal'); } else defender.hp = this.canExceedMax ? targetHp : Math.min(defender.maxHp, targetHp);
                break;
            case 'equal_to_opponent':
                targetHp = defender.hp;
                if (__universeBudget.battleFor(attacker)?.enemy === attacker) { if (targetHp < attacker.hp) __ubDamage(defender, attacker, attacker.hp - targetHp, 'fraction'); else __ubHeal(attacker, targetHp - attacker.hp, 'hp-equal'); } else attacker.hp = this.canExceedMax ? targetHp : Math.min(attacker.maxHp, targetHp);
                break;
            case 'average':
                targetHp = Math.floor((attacker.hp + defender.hp) / 2);
                if (__universeBudget.battleFor(attacker)?.enemy === attacker) { if (targetHp < attacker.hp) __ubDamage(defender, attacker, attacker.hp - targetHp, 'fraction'); else __ubHeal(attacker, targetHp - attacker.hp, 'hp-equal'); } else attacker.hp = this.canExceedMax ? targetHp : Math.min(attacker.maxHp, targetHp);
                if (__universeBudget.battleFor(defender)?.enemy === defender) { if (targetHp < defender.hp) __ubDamage(attacker, defender, defender.hp - targetHp, 'fraction'); else __ubHeal(defender, targetHp - defender.hp, 'hp-equal'); } else defender.hp = this.canExceedMax ? targetHp : Math.min(defender.maxHp, targetHp);
                break;
        }
        // 确保HP不低于0
        attacker.hp = Math.max(0, attacker.hp);
        defender.hp = Math.max(0, defender.hp);
        return [this.createResult(true, 'both', 'hp_equal', `同生共死：HP变为${targetHp}`, targetHp, {
                universeAlreadyApplied: true,
                mode: this.mode,
                targetHp,
                attackerHpChange: attacker.hp - oldAttackerHp,
                defenderHpChange: defender.hp - oldDefenderHp,
                attackerHp: attacker.hp,
                defenderHp: defender.hp
            })];
    }
}
exports.HpEqual = HpEqual;
/**
 * 最大HP修正效果
 *
 * 功能：
 * - 修改目标的最大HP值
 * - 支持倍率、加值、设置三种模式
 * - 可设置持续回合数或永久生效
 * - 可选择是否同时回复HP到新的最大值
 *
 * 使用场景：
 * - 巨大化（最大HP翻倍）
 * - 虚弱（最大HP减半）
 * - HP强化（最大HP+100）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "max_hp_modifier",
 *   "target": "self",
 *   "mode": "multiply",
 *   "value": 2.0,
 *   "duration": 5,
 *   "healToNew": true
 * }
 * ```
 *
 * 状态数据结构：
 * ```typescript
 * {
 *   originalMaxHp: number;      // 原始最大HP
 *   modifiedMaxHp: number;      // 修正后最大HP
 *   remainingTurns?: number;    // 剩余回合数
 *   isModified: boolean;        // 是否已修正
 * }
 * ```
 */
class MaxHpModifier extends BaseAtomicEffect_1.BaseAtomicEffect {
    target;
    mode;
    value;
    duration;
    healToNew;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'MaxHpModifier', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.TURN_END]);
        this.target = params.target;
        this.mode = params.mode;
        this.value = params.value;
        this.duration = params.duration;
        this.healToNew = params.healToNew ?? false;
    }
    execute(context) {
        const results = [];
        const targetPet = this.getTarget(context, this.target);
        // 在AFTER_SKILL时机执行修正
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            const originalMaxHp = targetPet.maxHp ?? 0;
            let newMaxHp = originalMaxHp;
            // 计算新的最大HP
            switch (this.mode) {
                case 'multiply':
                    newMaxHp = Math.floor(originalMaxHp * this.value);
                    break;
                case 'add':
                    newMaxHp = originalMaxHp + this.value;
                    break;
                case 'set':
                    newMaxHp = this.value;
                    break;
            }
            // 确保最大HP至少为1
            newMaxHp = Math.max(1, newMaxHp);
            // 应用最大HP修正
            targetPet.maxHp = newMaxHp;
            // 记录修正状态
            this.setModifierState(targetPet, originalMaxHp, newMaxHp, this.duration);
            // 如果需要，回复HP到新的最大值
            if (this.healToNew) {
                const currentHp = targetPet.hp ?? 0;
                const hpDiff = newMaxHp - currentHp;
                if (hpDiff > 0) {
                    if (__ubFatal(targetPet)) { if (newMaxHp > targetPet.hp) __ubHeal(targetPet, newMaxHp - targetPet.hp, 'max-hp-heal', true); else __ubDamage(context.attacker, targetPet, targetPet.hp - newMaxHp, 'other'); } else targetPet.hp = newMaxHp;
                    results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'heal', `HP回复了${hpDiff}！`, hpDiff, {universeAlreadyApplied: true}));
                }
            }
            else {
                // 如果当前HP超过新的最大HP，调整当前HP
                const currentHp = targetPet.hp ?? 0;
                if (currentHp > newMaxHp) {
                    if (__ubFatal(targetPet)) { if (newMaxHp > targetPet.hp) __ubHeal(targetPet, newMaxHp - targetPet.hp, 'max-hp-heal', true); else __ubDamage(context.attacker, targetPet, targetPet.hp - newMaxHp, 'other'); } else targetPet.hp = newMaxHp;
                }
            }
            results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'max_hp_modifier', `最大HP变为${newMaxHp}！`, newMaxHp, {
                originalMaxHp,
                newMaxHp,
                mode: this.mode,
                value: this.value,
                duration: this.duration
            }));
            this.log(`最大HP修正: ${this.target === 'self' ? '自己' : '对手'}的最大HP ` +
                `${originalMaxHp}→${newMaxHp} (${this.mode}: ${this.value})`);
        }
        // 在TURN_END时机检查持续时间
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            const modifierState = this.getModifierState(targetPet);
            if (modifierState.isModified && modifierState.remainingTurns !== undefined) {
                modifierState.remainingTurns--;
                if (modifierState.remainingTurns <= 0) {
                    // 恢复原始最大HP
                    targetPet.maxHp = modifierState.originalMaxHp;
                    modifierState.isModified = false;
                    // 如果当前HP超过原始最大HP，调整当前HP
                    const currentHp = targetPet.hp ?? 0;
                    if (currentHp > modifierState.originalMaxHp) {
                        if (__ubFatal(targetPet)) __ubDamage(context.attacker, targetPet, targetPet.hp - modifierState.originalMaxHp, 'other'); else targetPet.hp = modifierState.originalMaxHp;
                    }
                    results.push(this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'max_hp_restore', `最大HP恢复了！`, modifierState.originalMaxHp));
                    this.log(`最大HP恢复: ${this.target === 'self' ? '自己' : '对手'}的最大HP ` +
                        `${modifierState.modifiedMaxHp}→${modifierState.originalMaxHp}`);
                }
            }
        }
        return results;
    }
    validate(params) {
        if (!['self', 'opponent'].includes(params.target)) {
            this.log('target必须是self或opponent', 'error');
            return false;
        }
        if (!['multiply', 'add', 'set'].includes(params.mode)) {
            this.log('mode必须是multiply、add或set', 'error');
            return false;
        }
        if (params.value === undefined) {
            this.log('value是必需参数', 'error');
            return false;
        }
        if (params.mode === 'multiply' && params.value <= 0) {
            this.log('multiply模式的value必须大于0', 'error');
            return false;
        }
        if (params.mode === 'set' && params.value < 1) {
            this.log('set模式的value必须至少为1', 'error');
            return false;
        }
        return true;
    }
    /**
     * 获取修正状态
     */
    getModifierState(pet) {
        if (!pet.effectStates) {
            pet.effectStates = {};
        }
        if (!pet.effectStates.maxHpModifier) {
            pet.effectStates.maxHpModifier = {
                originalMaxHp: pet.maxHp ?? 0,
                modifiedMaxHp: pet.maxHp ?? 0,
                isModified: false
            };
        }
        return pet.effectStates.maxHpModifier;
    }
    /**
     * 设置修正状态
     */
    setModifierState(pet, originalMaxHp, modifiedMaxHp, duration) {
        const state = this.getModifierState(pet);
        state.originalMaxHp = originalMaxHp;
        state.modifiedMaxHp = modifiedMaxHp;
        state.isModified = true;
        if (duration !== undefined) {
            state.remainingTurns = duration;
        }
    }
}
exports.MaxHpModifier = MaxHpModifier;
/**
 * 手下留情效果 (Mercy)
 *
 * 攻击不会导致对手HP降至0，至少保留1 HP。
 *
 * @category Special
 */
class Mercy extends BaseAtomicEffect_1.BaseAtomicEffect {
    remainingHp;
    alwaysActive;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Mercy', []);
        this.remainingHp = params.remainingHp || 1;
        this.alwaysActive = params.alwaysActive !== false;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { defender } = context;
        // 检查对手HP是否已经降至0或以下
        if (defender.hp <= 0) {
            if (!__ubFatal(defender)) defender.hp = this.remainingHp;
            return [this.createResult(true, 'defender', 'mercy', `手下留情：对手HP保留${this.remainingHp}点`, this.remainingHp, {
                    remainingHp: this.remainingHp,
                    savedFromKo: true
                })];
        }
        // 如果总是生效，确保HP不低于指定值
        if (this.alwaysActive && defender.hp < this.remainingHp) {
            if (!__ubFatal(defender)) defender.hp = this.remainingHp;
            return [this.createResult(true, 'defender', 'mercy', `手下留情：对手HP保留${this.remainingHp}点`, this.remainingHp, {
                    remainingHp: this.remainingHp,
                    savedFromKo: false
                })];
        }
        return [this.createResult(false, 'defender', 'mercy', '手下留情：对手HP正常')];
    }
}
exports.Mercy = Mercy;
/**
 * 随机HP削减效果
 *
 * 随机削减对方或自己的HP
 *
 * @category Special
 * @example
 * // 随机HP削减
 * {
 *   opponentRatio: 0.5,
 *   opponentChance: 0.5,
 *   selfRatio: 0.5,
 *   selfChance: 0.5
 * }
 */
class RandomHpLoss extends BaseAtomicEffect_1.BaseAtomicEffect {
    opponentRatio;
    opponentChance;
    selfRatio;
    selfChance;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'RandomHpLoss', []);
        this.opponentRatio = params.opponentRatio;
        this.opponentChance = params.opponentChance;
        this.selfRatio = params.selfRatio;
        this.selfChance = params.selfChance;
    }
    validate(params) {
        return this.opponentChance + this.selfChance <= 1;
    }
    execute(context) {
        const { attacker, defender } = context;
        const roll = Math.random();
        if (roll < this.opponentChance) {
            // 削减对方HP
            const loss = Math.floor(defender.maxHp * this.opponentRatio);
            if (__ubFatal(defender)) __ubDamage(attacker, defender, loss, 'fraction'); else defender.hp = Math.max(1, defender.hp - loss);
            return [this.createResult(true, 'defender', 'random_hp_loss', `对方HP削减（${loss}点）`, loss, {
                    target: 'opponent',
                    loss
                })];
        }
        else if (roll < this.opponentChance + this.selfChance) {
            // 削减自己HP
            const loss = Math.floor(attacker.maxHp * this.selfRatio);
            if (__ubFatal(attacker)) __ubDamage(attacker, attacker, loss, 'fraction'); else attacker.hp = Math.max(1, attacker.hp - loss);
            return [this.createResult(true, 'attacker', 'random_hp_loss', `自己HP削减（${loss}点）`, loss, {
                    target: 'self',
                    loss
                })];
        }
        return [this.createResult(false, 'attacker', 'random_hp_loss', '未触发HP削减')];
    }
}
exports.RandomHpLoss = RandomHpLoss;
//# sourceMappingURL=HpEffects.js.map
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
