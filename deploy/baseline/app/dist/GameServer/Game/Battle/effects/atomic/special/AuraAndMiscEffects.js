"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleReward = exports.TypeSkillCounter = exports.Substitute = exports.Transform = exports.ClearTurnEffects = exports.WeakenEffect = exports.ConditionalContinuousDamage = exports.ConditionalDrainAura = exports.DrainAura = exports.SpecialEffect = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
const BattleModel_1 = require("../../../../../../shared/models/BattleModel");
class SpecialEffect extends BaseAtomicEffect_1.BaseAtomicEffect {
    params;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Special Effect', []);
        this.params = params;
    }
    execute(context) {
        const results = [];
        this.log(`执行特殊效果: ${this.params.specialType}`, 'debug');
        return results;
    }
    validate(params) {
        return params && params.type === IAtomicEffect_1.AtomicEffectType.SPECIAL && typeof params.specialType === 'string';
    }
}
exports.SpecialEffect = SpecialEffect;
class DrainAura extends BaseAtomicEffect_1.BaseAtomicEffect {
    drainPercent;
    duration;
    affectAllAttacks;
    maxDrain;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'DrainAura', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY, EffectContext_1.EffectTiming.TURN_END]);
        this.drainPercent = params.drainPercent;
        this.duration = params.duration;
        this.affectAllAttacks = params.affectAllAttacks ?? true;
        this.maxDrain = params.maxDrain ?? Infinity;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            const auraState = this.getAuraState(attacker);
            auraState.isActive = true;
            auraState.drainPercent = this.drainPercent;
            if (this.duration !== undefined) {
                auraState.remainingTurns = this.duration;
            }
            results.push(this.createResult(true, 'attacker', 'drain_aura_activate', `吸血光环激活！攻击将回复${this.drainPercent}%伤害`, this.drainPercent, { duration: this.duration }));
            this.log(`吸血光环激活: ${this.drainPercent}%, 持续${this.duration ?? '永久'}回合`);
        }
        if (context.timing === EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY) {
            const auraState = this.getAuraState(attacker);
            if (!auraState.isActive)
                return results;
            const damage = context.damage ?? 0;
            if (damage <= 0)
                return results;
            let drainAmount = Math.floor(damage * auraState.drainPercent / 100);
            if (drainAmount > this.maxDrain)
                drainAmount = this.maxDrain;
            const currentHp = attacker.hp ?? 0;
            const maxHp = attacker.maxHp ?? 0;
            const actualHeal = Math.min(drainAmount, maxHp - currentHp);
            if (actualHeal > 0) {
                if (attacker.hp !== undefined)
                    if (__universeBudget.battleFor(attacker)) { __ubHeal(attacker, actualHeal, 'drain-aura', false); } else { attacker.hp += actualHeal; }
                auraState.totalDrained = (auraState.totalDrained ?? 0) + actualHeal;
                results.push(this.createResult(true, 'attacker', 'drain_aura_heal', `吸血光环回复了${actualHeal}HP！`, actualHeal, { damage, drainPercent: auraState.drainPercent, totalDrained: auraState.totalDrained }));
                this.log(`吸血光环回复: 伤害${damage} × ${auraState.drainPercent}% = ${actualHeal}HP (总计${auraState.totalDrained}HP)`);
            }
        }
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            const auraState = this.getAuraState(attacker);
            if (auraState.isActive && auraState.remainingTurns !== undefined) {
                auraState.remainingTurns--;
                if (auraState.remainingTurns <= 0) {
                    auraState.isActive = false;
                    results.push(this.createResult(true, 'attacker', 'drain_aura_end', `吸血光环结束了！`, 0, { totalDrained: auraState.totalDrained }));
                    this.log(`吸血光环结束，总计吸血${auraState.totalDrained ?? 0}HP`);
                }
            }
        }
        return results;
    }
    validate(params) {
        if (params.drainPercent === undefined || params.drainPercent < 0 || params.drainPercent > 100) {
            this.log('drainPercent必须在0-100之间', 'error');
            return false;
        }
        if (params.duration !== undefined && params.duration < 1) {
            this.log('duration必须大于0', 'error');
            return false;
        }
        return true;
    }
    getAuraState(pet) {
        if (!pet.effectStates)
            pet.effectStates = {};
        if (!pet.effectStates.drainAura)
            pet.effectStates.drainAura = { drainPercent: 0, isActive: false, totalDrained: 0 };
        return pet.effectStates.drainAura;
    }
}
exports.DrainAura = DrainAura;
class ConditionalDrainAura extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    drainRatio;
    condition;
    conditionValue;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'ConditionalDrainAura', []);
        this.duration = params.duration;
        this.drainRatio = params.drainRatio;
        this.condition = params.condition;
        this.conditionValue = params.conditionValue;
    }
    validate(params) { return this.duration > 0 && this.drainRatio > 0; }
    execute(context) {
        const { attacker, defender, damage } = context;
        if (!this.checkCondition(context)) {
            return [this.createResult(false, 'attacker', 'conditional_drain_aura', '条件不满足')];
        }
        const drainAmount = damage ? Math.floor(damage * this.drainRatio) : 0;
        if (drainAmount > 0) {
            if (__universeBudget.battleFor(attacker)) { __ubHeal(attacker, drainAmount, 'conditional-drain', false); } else { attacker.hp = Math.min(attacker.maxHp, attacker.hp + drainAmount); }
            return [this.createResult(true, 'attacker', 'conditional_drain_aura', `条件吸血（回复${drainAmount}HP）`, drainAmount, { drainAmount, condition: this.condition, duration: this.duration })];
        }
        return [this.createResult(false, 'attacker', 'conditional_drain_aura', '无伤害，无法吸血')];
    }
    checkCondition(context) {
        const { attacker, defender } = context;
        switch (this.condition) {
            case 'first_strike': return attacker.speed > defender.speed;
            case 'hp_below': return this.conditionValue ? (attacker.hp / attacker.maxHp) <= this.conditionValue : false;
            case 'stat_boosted': return attacker.battleLevels ? attacker.battleLevels.some((level) => level > 0) : false;
            default: return false;
        }
    }
}
exports.ConditionalDrainAura = ConditionalDrainAura;
class ConditionalContinuousDamage extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    damagePerTurn;
    condition;
    conditionValue;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'ConditionalContinuousDamage', []);
        this.duration = params.duration;
        this.damagePerTurn = params.damagePerTurn;
        this.condition = params.condition;
        this.conditionValue = params.conditionValue;
    }
    validate(params) { return this.duration > 0 && this.damagePerTurn > 0; }
    execute(context) {
        const { attacker, defender } = context;
        if (!this.checkCondition(context)) {
            return [this.createResult(false, 'defender', 'conditional_continuous_damage', '条件不满足')];
        }
        const actualDamage = Math.min(this.damagePerTurn, defender.hp);
        if (__universeBudget.battleFor(defender)) { __ubDamage(attacker, defender, actualDamage, 'dot'); } else { defender.hp = Math.max(0, defender.hp - actualDamage); }
        return [this.createResult(true, 'defender', 'conditional_continuous_damage', `条件持续伤害（${actualDamage}点）`, actualDamage, { damagePerTurn: this.damagePerTurn, condition: this.condition, duration: this.duration })];
    }
    checkCondition(context) {
        const { attacker, defender } = context;
        switch (this.condition) {
            case 'self_weakened':
                const hasStatDown = attacker.battleLevels?.some((level) => level < 0) || false;
                const hasStatus = attacker.status !== undefined && attacker.status !== BattleModel_1.BattleStatus.NONE;
                return hasStatDown || hasStatus;
            case 'target_boosted': return defender.battleLevels ? defender.battleLevels.some((level) => level > 0) : false;
            case 'hp_below': return this.conditionValue ? (defender.hp / defender.maxHp) <= this.conditionValue : false;
            default: return false;
        }
    }
}
exports.ConditionalContinuousDamage = ConditionalContinuousDamage;
class WeakenEffect extends BaseAtomicEffect_1.BaseAtomicEffect {
    weakenType;
    ratio;
    duration;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'WeakenEffect', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC, EffectContext_1.EffectTiming.TURN_END]);
        this.weakenType = params.weakenType;
        this.ratio = params.ratio;
        this.duration = params.duration ?? 0;
    }
    execute(context) {
        const results = [];
        const target = this.getDefender(context);
        if (!target) {
            this.log('衰弱效果：目标不存在', 'warn');
            return results;
        }
        const state = this.getWeakenState(target);
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            state.isActive = true;
            state.remainingTurns = this.duration;
            state.weakenType = this.weakenType;
            state.ratio = this.ratio;
            results.push(this.createResult(true, 'defender', 'weaken', `激活衰弱效果（${this.weakenType}）`, this.ratio, { duration: this.duration }));
            this.log(`衰弱效果：激活${this.weakenType}衰弱，持续${this.duration}回合`);
        }
        if (context.timing === EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC && state.isActive) {
            if (state.weakenType === 'damage' || state.weakenType === 'all') {
                const attacker = this.getAttacker(context);
                if (attacker && this.isWeakened(attacker, state)) {
                    const oldDamage = context.damage || 0;
                    context.damage = Math.floor(oldDamage * (1 - state.ratio));
                    results.push(this.createResult(true, 'attacker', 'weaken', `伤害衰弱：${oldDamage}→${context.damage}`, oldDamage - context.damage, { weakenType: 'damage', ratio: state.ratio }));
                }
            }
        }
        if (context.timing === EffectContext_1.EffectTiming.TURN_END && state.isActive) {
            if (state.remainingTurns > 0) {
                state.remainingTurns--;
                if (state.remainingTurns === 0) {
                    state.isActive = false;
                    results.push(this.createResult(true, 'defender', 'weaken', '衰弱效果结束', 0));
                }
            }
        }
        return results;
    }
    isWeakened(pet, state) { return state.isActive && pet.effectStates?.weaken === state; }
    getWeakenState(pet) {
        if (!pet.effectStates)
            pet.effectStates = {};
        if (!pet.effectStates.weaken)
            pet.effectStates.weaken = { isActive: false, remainingTurns: 0, weakenType: '', ratio: 0 };
        return pet.effectStates.weaken;
    }
    validate(params) {
        if (!params.weakenType || !['damage', 'heal', 'all'].includes(params.weakenType)) {
            this.log('衰弱效果：weakenType必须是damage、heal或all', 'error');
            return false;
        }
        if (typeof params.ratio !== 'number' || params.ratio < 0 || params.ratio > 1) {
            this.log('衰弱效果：ratio必须在0-1之间', 'error');
            return false;
        }
        return true;
    }
}
exports.WeakenEffect = WeakenEffect;
class ClearTurnEffects extends BaseAtomicEffect_1.BaseAtomicEffect {
    target;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'ClearTurnEffects', []);
        this.target = params.target || 'opponent';
    }
    validate(params) { return true; }
    execute(context) {
        return [this.createResult(true, this.target === 'self' ? 'attacker' : 'defender', 'clear_turn_effects', `清除回合效果`, 1, { target: this.target })];
    }
}
exports.ClearTurnEffects = ClearTurnEffects;
class Transform extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    copyStatStages;
    copyHp;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Transform', []);
        this.duration = params.duration || 0;
        this.copyStatStages = params.copyStatStages !== false;
        this.copyHp = params.copyHp || false;
    }
    validate(params) { return true; }
    execute(context) {
        const { attacker, defender } = context;
        attacker.attack = defender.attack;
        attacker.defence = defender.defence;
        attacker.speed = defender.speed;
        attacker.skills = [...defender.skills];
        if (defender.skillPP)
            attacker.skillPP = [...defender.skillPP];
        attacker.type = defender.type;
        if (this.copyStatStages && defender.battleLv)
            attacker.battleLv = [...defender.battleLv];
        return [this.createResult(true, 'attacker', 'transform', `变身成功：变身成${defender.name || '对手'}`, 0, { duration: this.duration, copyStatStages: this.copyStatStages, copyHp: this.copyHp })];
    }
}
exports.Transform = Transform;
class Substitute extends BaseAtomicEffect_1.BaseAtomicEffect {
    hpPercent;
    canBeCrit;
    canBeStatused;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'Substitute', []);
        this.hpPercent = params.hpPercent;
        this.canBeCrit = params.canBeCrit || false;
        this.canBeStatused = params.canBeStatused || false;
    }
    validate(params) { return params && params.hpPercent !== undefined; }
    execute(context) {
        const { attacker } = context;
        const substituteHp = Math.floor(attacker.maxHp * this.hpPercent);
        if (attacker.hp <= substituteHp) {
            return [this.createResult(false, 'attacker', 'substitute', '替身失败：HP不足')];
        }
        if (__universeBudget.battleFor(attacker)) { __ubDamage(attacker, attacker, substituteHp, 'other'); } else { attacker.hp -= substituteHp; }
        return [this.createResult(true, 'attacker', 'substitute', `替身成功：创建${substituteHp} HP的替身（简化实现）`, substituteHp, { substituteHp, hpCost: substituteHp, remainingHp: attacker.hp, canBeCrit: this.canBeCrit, canBeStatused: this.canBeStatused })];
    }
}
exports.Substitute = Substitute;
class TypeSkillCounter extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    counterType;
    statusId;
    statusDuration;
    probability;
    statIndex;
    statChange;
    damageValue;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'TypeSkillCounter', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.BEFORE_SKILL, EffectContext_1.EffectTiming.TURN_END]);
        this.duration = params.duration;
        this.counterType = params.counterType;
        this.statusId = params.statusId;
        this.statusDuration = params.statusDuration || 3;
        this.probability = params.probability || 100;
        this.statIndex = params.statIndex;
        this.statChange = params.statChange;
        this.damageValue = params.damageValue;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        const defender = this.getDefender(context);
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            if (!attacker.effectCounters)
                attacker.effectCounters = {};
            attacker.effectCounters['type_skill_counter'] = this.duration;
            attacker.effectCounters['type_skill_counter_prob'] = this.probability;
            if (this.counterType === 'status' && this.statusId !== undefined) {
                attacker.effectCounters['type_skill_counter_type'] = 1;
                attacker.effectCounters['type_skill_counter_status'] = this.statusId;
                attacker.effectCounters['type_skill_counter_duration'] = this.statusDuration;
            }
            else if (this.counterType === 'stat_change' && this.statIndex !== undefined && this.statChange !== undefined) {
                attacker.effectCounters['type_skill_counter_type'] = 2;
                attacker.effectCounters['type_skill_counter_stat'] = this.statIndex;
                attacker.effectCounters['type_skill_counter_change'] = this.statChange;
            }
            else if (this.counterType === 'damage' && this.damageValue !== undefined) {
                attacker.effectCounters['type_skill_counter_type'] = 3;
                attacker.effectCounters['type_skill_counter_damage'] = this.damageValue;
            }
            results.push(this.createResult(true, 'attacker', 'type_skill_counter', `属性技能反击状态！持续${this.duration}回合`, this.duration, { counterType: this.counterType }));
        }
        if (context.timing === EffectContext_1.EffectTiming.BEFORE_SKILL) {
            if (defender.effectCounters?.['type_skill_counter']) {
                const counterTypeNum = defender.effectCounters['type_skill_counter_type'] || 0;
                const prob = defender.effectCounters['type_skill_counter_prob'] || 100;
                const skill = context.skill;
                const isTypeSkill = true;
                if (skill && isTypeSkill && Math.random() * 100 < prob) {
                    if (counterTypeNum === 1) {
                        const statusId = defender.effectCounters['type_skill_counter_status'] || 0;
                        const duration = defender.effectCounters['type_skill_counter_duration'] || 3;
                        if (!attacker.status || attacker.status === -1) {
                            if (!attacker.immuneFlags?.status) {
                                if (__ubBlocked(attacker, statusId, defender)) return results;
                                attacker.status = statusId;
                                if (!attacker.statusDurations)
                                    attacker.statusDurations = [0, 0, 0, 0, 0, 0, 0, 0, 0];
                                attacker.statusDurations[statusId] = duration;
                                results.push(this.createResult(true, 'attacker', 'status_inflict', `属性技能反击！施加异常状态！`, statusId, { duration }));
                            }
                        }
                    }
                    else if (counterTypeNum === 2) {
                        const statIdx = defender.effectCounters['type_skill_counter_stat'] || 0;
                        const statChg = defender.effectCounters['type_skill_counter_change'] || 0;
                        if (!attacker.battleLv)
                            attacker.battleLv = [0, 0, 0, 0, 0, 0];
                        const oldLevel = attacker.battleLv[statIdx];
                        attacker.battleLv[statIdx] = Math.max(-6, Math.min(6, oldLevel + statChg));
                        results.push(this.createResult(true, 'attacker', 'stat_change', `属性技能反击！能力变化！`, statChg, { statIndex: statIdx, oldLevel, newLevel: attacker.battleLv[statIdx] }));
                    }
                    else if (counterTypeNum === 3) {
                        const dmgVal = defender.effectCounters['type_skill_counter_damage'] || 0;
                        if (attacker.hp !== undefined) {
                            if (__universeBudget.battleFor(attacker)) { __ubReflect(attacker, defender, dmgVal, 'type-counter'); } else { attacker.hp = Math.max(0, attacker.hp - dmgVal); }
                            results.push(this.createResult(true, 'attacker', 'damage', `属性技能反击！造成${__universeBudget.battleFor(context.attacker) ? "待结算" : dmgVal}伤害！`, dmgVal, {universeAlreadyApplied: true}));
                        }
                    }
                }
            }
        }
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            if (attacker.effectCounters?.['type_skill_counter']) {
                attacker.effectCounters['type_skill_counter']--;
                if (attacker.effectCounters['type_skill_counter'] <= 0) {
                    delete attacker.effectCounters['type_skill_counter'];
                    delete attacker.effectCounters['type_skill_counter_type'];
                    delete attacker.effectCounters['type_skill_counter_prob'];
                    delete attacker.effectCounters['type_skill_counter_status'];
                    delete attacker.effectCounters['type_skill_counter_duration'];
                    delete attacker.effectCounters['type_skill_counter_stat'];
                    delete attacker.effectCounters['type_skill_counter_change'];
                    delete attacker.effectCounters['type_skill_counter_damage'];
                    results.push(this.createResult(true, 'attacker', 'type_skill_counter_end', `属性技能反击状态解除！`, 0));
                }
            }
        }
        return results;
    }
    validate(params) {
        if (params.duration === undefined || params.duration < 1) {
            this.log('duration必须大于0', 'error');
            return false;
        }
        if (!params.counterType) {
            this.log('counterType必须指定', 'error');
            return false;
        }
        return true;
    }
}
exports.TypeSkillCounter = TypeSkillCounter;
class BattleReward extends BaseAtomicEffect_1.BaseAtomicEffect {
    rewardType;
    amount;
    dailyLimit;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'BattleReward', []);
        this.rewardType = params.rewardType;
        this.amount = params.amount;
        this.dailyLimit = params.dailyLimit;
    }
    validate(params) { return this.amount > 0; }
    execute(context) {
        const { attacker } = context;
        if (!attacker.effectCounters)
            attacker.effectCounters = {};
        const rewardKey = `battle_reward_${this.rewardType}`;
        attacker.effectCounters[rewardKey] = this.amount;
        if (this.dailyLimit)
            attacker.effectCounters[`${rewardKey}_limit`] = this.dailyLimit;
        return [this.createResult(true, 'attacker', 'battle_reward', `战斗奖励标记（${this.rewardType}: ${this.amount}）`, this.amount, { rewardType: this.rewardType, amount: this.amount, dailyLimit: this.dailyLimit })];
    }
}
exports.BattleReward = BattleReward;
//# sourceMappingURL=AuraAndMiscEffects.js.map
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
