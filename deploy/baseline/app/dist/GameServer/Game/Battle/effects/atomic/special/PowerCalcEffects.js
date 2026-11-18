"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Recoil = exports.LevelDamage = exports.WeightedRandomPower = exports.IvPower = exports.Reversal = exports.Punishment = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
/**
 * 惩罚效果 (Punishment)
 *
 * 根据对手的状态（能力提升、异常状态、HP百分比等）增加伤害。
 * 对手状态越好/越差，伤害越高。
 *
 * **功能：**
 * - stat_boost: 对手能力提升越多，伤害越高
 * - status: 对手异常状态越多，伤害越高
 * - hp_percent: 对手HP越高，伤害越高
 *
 * **使用场景：**
 *
 * 1. **惩罚强化（Effect_35）**
 *    - 对手每有1级能力提升，伤害+20
 *    - 例如：对手攻击+2、速度+1，伤害 = 基础 + 60
 *
 * 2. **惩罚异常状态**
 *    - 对手每有1个异常状态，伤害+30%
 *    - 例如：对手中毒+灼伤，伤害 = 基础 × 1.6
 *
 * 3. **惩罚高HP**
 *    - 对手HP越高，伤害越高
 *    - 例如：对手HP 100%时，伤害 = 基础 × 2.0
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Punishment",
 *   "timing": "BEFORE_DAMAGE_CALC",
 *   "params": {
 *     "type": "stat_boost",
 *     "multiplier": 20,
 *     "basePower": 60
 *   }
 * }
 * ```
 *
 * @category Special
 */
class Punishment extends BaseAtomicEffect_1.BaseAtomicEffect {
    punishmentType;
    multiplier;
    basePower;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Punishment', []);
        this.punishmentType = params.type;
        this.multiplier = params.multiplier;
        this.basePower = params.basePower || 60;
    }
    validate(params) {
        return params && params.type && params.multiplier !== undefined;
    }
    execute(context) {
        const { defender } = context;
        let bonusPower = 0;
        switch (this.punishmentType) {
            case 'stat_boost': {
                // 计算对手的能力提升总和（只计算正值）
                const battleLv = defender.battleLv || [0, 0, 0, 0, 0, 0];
                const totalBoosts = battleLv.reduce((sum, level) => sum + Math.max(0, level), 0);
                bonusPower = totalBoosts * this.multiplier;
                break;
            }
            case 'status': {
                // 计算对手的异常状态数量
                const statusArray = defender.statusArray || [];
                const statusCount = statusArray.filter(s => s > 0).length;
                bonusPower = statusCount * this.multiplier;
                break;
            }
            case 'hp_percent': {
                // 根据对手HP百分比计算
                const hpPercent = defender.hp / defender.maxHp;
                bonusPower = this.basePower * hpPercent * (this.multiplier - 1);
                break;
            }
        }
        // 修改技能威力
        if (context.skill) {
            const originalPower = context.skill.power || this.basePower;
            context.skill.power = originalPower + bonusPower;
        }
        return [this.createResult(true, 'defender', 'power_boost', `惩罚效果：威力+${bonusPower.toFixed(0)}`, bonusPower, {
                punishmentType: this.punishmentType,
                bonusPower,
                originalPower: this.basePower
            })];
    }
}
exports.Punishment = Punishment;
/**
 * 反转效果
 *
 * 功能：
 * - HP比例反转：HP越低威力越高
 * - 能力变化反转：将能力提升变为降低，降低变为提升
 * - 可设置威力基础值和最大值
 * - 动态计算威力
 *
 * 使用场景：
 * - 绝地反击（HP越低威力越高，最高200）
 * - 反转世界（交换所有能力变化的正负）
 * - 背水一战（HP低于25%时威力翻倍）
 *
 * 配置示例：
 * ```json
 * {
 *   "type": "special",
 *   "specialType": "reversal",
 *   "reversalType": "hp_ratio",
 *   "basePower": 20,
 *   "maxPower": 200
 * }
 * ```
 *
 * HP比例反转计算公式：
 * - 威力 = basePower + (maxPower - basePower) × (1 - HP百分比)
 * - 例如：HP 10%时，威力 = 20 + (200 - 20) × 0.9 = 182
 */
class Reversal extends BaseAtomicEffect_1.BaseAtomicEffect {
    reversalType;
    basePower;
    maxPower;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Reversal', [EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC, EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.reversalType = params.reversalType;
        this.basePower = params.basePower ?? 20;
        this.maxPower = params.maxPower ?? 200;
    }
    execute(context) {
        const results = [];
        switch (this.reversalType) {
            case 'hp_ratio':
                this.applyHpRatioReversal(context, results);
                break;
            case 'stat_changes':
                this.applyStatChangesReversal(context, results);
                break;
        }
        return results;
    }
    /**
     * 应用HP比例反转
     */
    applyHpRatioReversal(context, results) {
        if (context.timing !== EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC) {
            return;
        }
        const attacker = this.getAttacker(context);
        if (!attacker) {
            this.log('反转效果：攻击者不存在', 'warn');
            return;
        }
        // 计算HP百分比
        const hpRatio = attacker.hp / attacker.maxHp;
        // 计算威力：HP越低威力越高
        const powerBoost = (this.maxPower - this.basePower) * (1 - hpRatio);
        const finalPower = Math.floor(this.basePower + powerBoost);
        // 修改技能威力
        if (context.skill) {
            context.skill.power = finalPower;
        }
        context.skillPower = finalPower;
        results.push(this.createResult(true, 'attacker', 'reversal', `反转威力：${finalPower}（HP ${Math.floor(hpRatio * 100)}%）`, finalPower, {
            reversalType: 'hp_ratio',
            hpRatio,
            basePower: this.basePower,
            maxPower: this.maxPower
        }));
        this.log(`反转效果：HP ${Math.floor(hpRatio * 100)}%，威力${finalPower}`);
    }
    /**
     * 应用能力变化反转
     */
    applyStatChangesReversal(context, results) {
        if (context.timing !== EffectContext_1.EffectTiming.AFTER_SKILL) {
            return;
        }
        const target = this.getDefender(context);
        if (!target) {
            this.log('反转效果：目标不存在', 'warn');
            return;
        }
        if (!target.battleLevels) {
            target.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        // 反转所有能力变化
        const changes = [];
        const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
        for (let i = 0; i < target.battleLevels.length; i++) {
            const oldLevel = target.battleLevels[i];
            if (oldLevel !== 0) {
                target.battleLevels[i] = -oldLevel;
                changes.push(`${statNames[i]}:${oldLevel}→${-oldLevel}`);
            }
        }
        if (changes.length > 0) {
            results.push(this.createResult(true, 'defender', 'reversal', `反转能力变化：${changes.join(', ')}`, 0, { reversalType: 'stat_changes', changes }));
            this.log(`反转效果：反转能力变化（${changes.join(', ')}）`);
        }
        else {
            this.log('反转效果：目标没有能力变化', 'warn');
        }
    }
    validate(params) {
        if (!params.reversalType || !['hp_ratio', 'stat_changes'].includes(params.reversalType)) {
            this.log('反转效果：reversalType必须是hp_ratio或stat_changes', 'error');
            return false;
        }
        if (params.reversalType === 'hp_ratio') {
            if (params.basePower !== undefined && (typeof params.basePower !== 'number' || params.basePower < 0)) {
                this.log('反转效果：basePower必须是非负数', 'error');
                return false;
            }
            if (params.maxPower !== undefined && (typeof params.maxPower !== 'number' || params.maxPower < 0)) {
                this.log('反转效果：maxPower必须是非负数', 'error');
                return false;
            }
            if (params.basePower !== undefined && params.maxPower !== undefined && params.basePower >= params.maxPower) {
                this.log('反转效果：basePower必须小于maxPower', 'error');
                return false;
            }
        }
        return true;
    }
}
exports.Reversal = Reversal;
/**
 * 个体威力提升效果
 *
 * 根据个体值提升威力
 *
 * @category Special
 * @example
 * // 个体威力提升
 * {
 *   minPower: 1,
 *   maxPower: 155,
 *   ivType: 'total'
 * }
 */
class IvPower extends BaseAtomicEffect_1.BaseAtomicEffect {
    minPower;
    maxPower;
    ivType;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'IvPower', []);
        this.minPower = params.minPower;
        this.maxPower = params.maxPower;
        this.ivType = params.ivType;
    }
    validate(params) {
        return this.maxPower >= this.minPower;
    }
    execute(context) {
        const { attacker } = context;
        // 计算个体值（简化实现，使用能力值作为近似）
        const iv = this.calculateIv(attacker);
        // 根据个体值计算威力
        // IV范围通常是0-31，总和0-186
        // 映射到威力范围
        const ivRatio = Math.min(1, iv / 186);
        const power = Math.floor(this.minPower + (this.maxPower - this.minPower) * ivRatio);
        return [this.createResult(true, 'attacker', 'iv_power', `个体威力提升（威力${power}）`, power, {
                power,
                iv,
                ivType: this.ivType
            })];
    }
    calculateIv(pet) {
        // 简化实现：使用能力值总和作为个体值近似
        const stats = [
            pet.attack,
            pet.defence,
            pet.spAtk,
            pet.spDef,
            pet.speed,
            pet.maxHp
        ];
        switch (this.ivType) {
            case 'total':
                return stats.reduce((sum, stat) => sum + (stat % 32), 0);
            case 'average':
                return Math.floor(stats.reduce((sum, stat) => sum + (stat % 32), 0) / stats.length);
            case 'max':
                return Math.max(...stats.map(stat => stat % 32));
            default:
                return 0;
        }
    }
}
exports.IvPower = IvPower;
/**
 * 加权随机威力效果
 *
 * 按权重随机选择威力范围
 *
 * @category Special
 * @example
 * // 多段随机威力
 * {
 *   powerRanges: [
 *     { min: 301, max: 350, weight: 0.5 },
 *     { min: 101, max: 300, weight: 0.3 },
 *     { min: 5, max: 100, weight: 0.2 }
 *   ]
 * }
 */
class WeightedRandomPower extends BaseAtomicEffect_1.BaseAtomicEffect {
    powerRanges;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'WeightedRandomPower', []);
        this.powerRanges = params.powerRanges;
    }
    validate(params) {
        if (!this.powerRanges || this.powerRanges.length === 0) {
            return false;
        }
        // 检查权重总和是否为1
        const totalWeight = this.powerRanges.reduce((sum, range) => sum + range.weight, 0);
        return Math.abs(totalWeight - 1) < 0.01;
    }
    execute(context) {
        // 按权重随机选择范围
        const roll = Math.random();
        let cumulative = 0;
        let selectedRange = this.powerRanges[0];
        for (const range of this.powerRanges) {
            cumulative += range.weight;
            if (roll <= cumulative) {
                selectedRange = range;
                break;
            }
        }
        // 在选中的范围内随机选择威力
        const power = Math.floor(Math.random() * (selectedRange.max - selectedRange.min + 1) + selectedRange.min);
        return [this.createResult(true, 'attacker', 'weighted_random_power', `加权随机威力（${power}）`, power, {
                power,
                selectedRange: `${selectedRange.min}-${selectedRange.max}`,
                weight: selectedRange.weight
            })];
    }
}
exports.WeightedRandomPower = WeightedRandomPower;
/**
 * 等级伤害附加效果
 *
 * 根据自身等级计算额外伤害
 *
 * @category Special
 */
class LevelDamage extends BaseAtomicEffect_1.BaseAtomicEffect {
    levelMultiplier;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'LevelDamage', []);
        this.levelMultiplier = params.levelMultiplier || 1;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker, damage } = context;
        // 计算等级附加伤害
        const level = attacker.level || 1;
        const additionalDamage = Math.floor(level * this.levelMultiplier);
        // 添加到伤害
        if (damage !== undefined) {
            context.damage = damage + additionalDamage;
        }
        return [this.createResult(true, 'attacker', 'level_damage', `等级伤害附加 +${additionalDamage}`, additionalDamage, {
                level,
                multiplier: this.levelMultiplier,
                additionalDamage
            })];
    }
}
exports.LevelDamage = LevelDamage;
/**
 * 反作用力效果 (Recoil)
 *
 * 使用技能后，自己受到反作用力伤害。
 * 伤害可以基于造成的伤害、最大HP或固定值。
 *
 * **功能：**
 * - damage_percent: 基于造成伤害的百分比
 * - max_hp_percent: 基于自己最大HP的百分比
 * - fixed: 固定伤害
 * - 可选择是否能导致自己昏厥
 *
 * **使用场景：**
 *
 * 1. **猛撞类技能（Effect_11）**
 *    - 造成伤害的1/4反作用力
 *    - 例如：造成100伤害，自己受到25伤害
 *
 * 2. **舍身冲撞**
 *    - 造成伤害的1/3反作用力
 *    - 例如：造成120伤害，自己受到40伤害
 *
 * 3. **爆炸类技能**
 *    - 自己最大HP的50%反作用力
 *    - 可以导致自己昏厥
 *
 * 4. **心灵冲击**
 *    - 固定50点反作用力
 *
 * **JSON配置示例：**
 *
 * ```json
 * {
 *   "type": "Recoil",
 *   "timing": "AFTER_SKILL",
 *   "params": {
 *     "mode": "damage_percent",
 *     "value": 0.25,
 *     "canKo": false
 *   }
 * }
 * ```
 *
 * @category Special
 */
class Recoil extends BaseAtomicEffect_1.BaseAtomicEffect {
    mode;
    value;
    canKo;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Recoil', []);
        this.mode = params.mode;
        this.value = params.value;
        this.canKo = params.canKo !== false;
    }
    validate(params) {
        return params && params.mode && params.value !== undefined;
    }
    execute(context) {
        const { attacker, damage } = context;
        let recoilDamage = 0;
        // 计算反作用力伤害
        switch (this.mode) {
            case 'damage_percent':
                recoilDamage = Math.floor(damage * this.value);
                break;
            case 'max_hp_percent':
                recoilDamage = Math.floor(attacker.maxHp * this.value);
                break;
            case 'fixed':
                recoilDamage = this.value;
                break;
        }
        // 应用反作用力
        if (recoilDamage > 0) {
            const oldHp = attacker.hp;
            if (this.canKo) {
                // 可以导致昏厥
                if (__universeBudget.battleFor(attacker)) { __ubDamage(attacker, attacker, recoilDamage, 'other'); } else { attacker.hp = Math.max(0, attacker.hp - recoilDamage); }
            }
            else {
                // 不能导致昏厥，至少保留1HP
                if (__ubFatal(attacker)) __ubDamage(attacker, attacker, recoilDamage, 'other'); else attacker.hp = Math.max(1, attacker.hp - recoilDamage);
            }
            const actualDamage = oldHp - attacker.hp;
            return [this.createResult(true, 'attacker', 'recoil', `反作用力：自己受到${actualDamage}点伤害`, actualDamage, {
                    recoilDamage: actualDamage,
                    mode: this.mode,
                    canKo: this.canKo,
                    remainingHp: attacker.hp
                })];
        }
        return [this.createResult(false, 'attacker', 'recoil', '反作用力：无伤害')];
    }
}
exports.Recoil = Recoil;
//# sourceMappingURL=PowerCalcEffects.js.map
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
