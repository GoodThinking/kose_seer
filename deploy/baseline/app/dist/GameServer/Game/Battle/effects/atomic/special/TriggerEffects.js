"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DelayedKill = exports.OnEvadeBoost = exports.OnOpponentMiss = exports.MissPenalty = exports.KoTransferBuff = exports.KoDamageNext = void 0;
const BaseAtomicEffect_1 = require("../core/BaseAtomicEffect");
const IAtomicEffect_1 = require("../core/IAtomicEffect");
const EffectContext_1 = require("../../core/EffectContext");
class KoDamageNext extends BaseAtomicEffect_1.BaseAtomicEffect {
    mode;
    value;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'KoDamageNext', [EffectContext_1.EffectTiming.AFTER_KO]);
        this.mode = params.mode;
        this.value = params.value ?? 0;
    }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        if ((defender.hp ?? 0) > 0) {
            return results;
        }
        let nextDamage = 0;
        switch (this.mode) {
            case 'percent':
                const maxHp = defender.maxHp ?? 0;
                nextDamage = Math.floor(maxHp * this.value / 100);
                break;
            case 'fixed':
                nextDamage = this.value;
                break;
            case 'overflow':
                const actualDamage = context.damage;
                const hpBeforeDamage = (defender.hp ?? 0) + actualDamage;
                nextDamage = Math.max(0, actualDamage - hpBeforeDamage);
                break;
        }
        if (nextDamage > 0) {
            results.push(this.createResult(true, 'defender', 'ko_damage_next', `击败后将对下一只造成${nextDamage}伤害！`, nextDamage, { mode: this.mode, damage: nextDamage }));
            this.log(`击败伤害下一只: ${this.mode}模式, 伤害${nextDamage}`);
        }
        return results;
    }
    validate(params) {
        if (!['percent', 'fixed', 'overflow'].includes(params.mode)) {
            this.log('mode必须是percent、fixed或overflow', 'error');
            return false;
        }
        if (params.mode !== 'overflow' && params.value === undefined) {
            this.log('percent和fixed模式需要指定value', 'error');
            return false;
        }
        return true;
    }
}
exports.KoDamageNext = KoDamageNext;
class KoTransferBuff extends BaseAtomicEffect_1.BaseAtomicEffect {
    onlyPositive;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'KoTransferBuff', []);
        this.onlyPositive = params.onlyPositive !== false;
    }
    validate(params) {
        return true;
    }
    execute(context) {
        const { attacker, defender, damage } = context;
        const defenderHp = defender.hp;
        const willKo = damage !== undefined && damage >= defenderHp;
        if (!willKo) {
            return [this.createResult(false, 'attacker', 'ko_transfer_buff', '未击败对手')];
        }
        let transferredCount = 0;
        if (defender.battleLevels && attacker.battleLevels) {
            for (let i = 0; i < defender.battleLevels.length; i++) {
                const defenderLevel = defender.battleLevels[i];
                if (this.onlyPositive && defenderLevel > 0) {
                    attacker.battleLevels[i] = Math.min(6, attacker.battleLevels[i] + defenderLevel);
                    transferredCount++;
                }
                else if (!this.onlyPositive && defenderLevel !== 0) {
                    attacker.battleLevels[i] = Math.max(-6, Math.min(6, attacker.battleLevels[i] + defenderLevel));
                    transferredCount++;
                }
            }
        }
        return [this.createResult(transferredCount > 0, 'attacker', 'ko_transfer_buff', `击败转移强化（${transferredCount}个能力）`, transferredCount, { transferredCount, onlyPositive: this.onlyPositive })];
    }
}
exports.KoTransferBuff = KoTransferBuff;
class MissPenalty extends BaseAtomicEffect_1.BaseAtomicEffect {
    penaltyType;
    hpDamage;
    hpDamageMode;
    statIndex;
    statChange;
    statusId;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'MissPenalty', [EffectContext_1.EffectTiming.AFTER_SKILL]);
        this.penaltyType = params.penaltyType;
        this.hpDamage = params.hpDamage ?? 0;
        this.hpDamageMode = params.hpDamageMode ?? 'percent';
        this.statIndex = params.statIndex ?? 0;
        this.statChange = params.statChange ?? -1;
        this.statusId = params.statusId ?? 0;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        if (!attacker) {
            this.log('Miss惩罚效果：攻击者不存在', 'warn');
            return results;
        }
        const skillMissed = context.effectData?.missed === true || context.effectData?.hit === false;
        if (!skillMissed) {
            return results;
        }
        const state = this.getMissPenaltyState(attacker);
        state.missCount = (state.missCount || 0) + 1;
        switch (this.penaltyType) {
            case 'hp_damage':
                this.applyHpDamagePenalty(attacker, results);
                break;
            case 'stat_down':
                this.applyStatDownPenalty(attacker, results);
                break;
            case 'status':
                this.applyStatusPenalty(attacker, results);
                break;
        }
        return results;
    }
    applyHpDamagePenalty(attacker, results) {
        let damage = 0;
        if (this.hpDamageMode === 'percent') {
            damage = Math.floor(attacker.maxHp * (this.hpDamage / 100));
        }
        else {
            damage = this.hpDamage;
        }
        damage = Math.min(damage, attacker.hp - 1);
        damage = Math.max(0, damage);
        if (damage > 0) {
            if (__universeBudget.battleFor(attacker)) { __ubDamage(attacker, attacker, damage, 'other'); } else { attacker.hp -= damage; }
            results.push(this.createResult(true, 'attacker', 'miss_penalty', `Miss惩罚：损失${damage}HP`, damage, { penaltyType: 'hp_damage', mode: this.hpDamageMode }));
            this.log(`Miss惩罚效果：攻击者损失${damage}HP`);
        }
    }
    applyStatDownPenalty(attacker, results) {
        if (!attacker.battleLevels) {
            attacker.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        const oldLevel = attacker.battleLevels[this.statIndex];
        attacker.battleLevels[this.statIndex] = Math.max(-6, Math.min(6, oldLevel + this.statChange));
        const newLevel = attacker.battleLevels[this.statIndex];
        const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
        const statName = statNames[this.statIndex] || '未知';
        results.push(this.createResult(true, 'attacker', 'miss_penalty', `Miss惩罚：${statName}${this.statChange > 0 ? '+' : ''}${this.statChange}`, this.statChange, { penaltyType: 'stat_down', statIndex: this.statIndex, oldLevel, newLevel }));
        this.log(`Miss惩罚效果：攻击者${statName}从${oldLevel}变为${newLevel}`);
    }
    applyStatusPenalty(attacker, results) {
        if (!attacker.status) {
            __ubBlocked(attacker, this.statusId, attacker);
            attacker.status = this.statusId;
            const statusNames = ['麻痹', '中毒', '烧伤', '冻伤', '睡眠', '混乱', '害怕', '疲惫'];
            const statusName = statusNames[this.statusId] || '未知';
            results.push(this.createResult(true, 'attacker', 'miss_penalty', `Miss惩罚：陷入${statusName}状态`, this.statusId, { penaltyType: 'status', statusId: this.statusId }));
            this.log(`Miss惩罚效果：攻击者陷入${statusName}状态`);
        }
    }
    getMissPenaltyState(pet) {
        if (!pet.effectStates) {
            pet.effectStates = {};
        }
        if (!pet.effectStates.missPenalty) {
            pet.effectStates.missPenalty = { missCount: 0 };
        }
        return pet.effectStates.missPenalty;
    }
    validate(params) {
        if (!params.penaltyType || !['hp_damage', 'stat_down', 'status'].includes(params.penaltyType)) {
            this.log('Miss惩罚效果：penaltyType必须是hp_damage、stat_down或status', 'error');
            return false;
        }
        if (params.penaltyType === 'hp_damage') {
            if (typeof params.hpDamage !== 'number' || params.hpDamage <= 0) {
                this.log('Miss惩罚效果：hpDamage必须是正数', 'error');
                return false;
            }
            if (params.hpDamageMode === 'percent' && (params.hpDamage < 0 || params.hpDamage > 100)) {
                this.log('Miss惩罚效果：百分比模式下hpDamage必须在0-100之间', 'error');
                return false;
            }
        }
        if (params.penaltyType === 'stat_down') {
            if (typeof params.statIndex !== 'number' || params.statIndex < 0 || params.statIndex > 5) {
                this.log('Miss惩罚效果：statIndex必须在0-5之间', 'error');
                return false;
            }
            if (typeof params.statChange !== 'number' || params.statChange < -6 || params.statChange > 6) {
                this.log('Miss惩罚效果：statChange必须在-6到6之间', 'error');
                return false;
            }
        }
        if (params.penaltyType === 'status') {
            if (typeof params.statusId !== 'number' || params.statusId < 0) {
                this.log('Miss惩罚效果：statusId必须是非负整数', 'error');
                return false;
            }
        }
        return true;
    }
}
exports.MissPenalty = MissPenalty;
class OnOpponentMiss extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    effect;
    effectDuration;
    statIndex;
    statChange;
    healAmount;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'OnOpponentMiss', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.BEFORE_SKILL, EffectContext_1.EffectTiming.TURN_END]);
        this.duration = params.duration;
        this.effect = params.effect;
        this.effectDuration = params.effectDuration || 1;
        this.statIndex = params.statIndex;
        this.statChange = params.statChange;
        this.healAmount = params.healAmount;
    }
    execute(context) {
        const results = [];
        const attacker = this.getAttacker(context);
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            if (!attacker.effectCounters) {
                attacker.effectCounters = {};
            }
            attacker.effectCounters['on_opponent_miss'] = this.duration;
            this.log(`对方Miss触发状态: 持续${this.duration}回合（需要战斗系统集成）`);
            results.push(this.createResult(true, 'attacker', 'on_opponent_miss', `对方Miss触发状态！持续${this.duration}回合`, this.duration));
            this.log(`对方Miss触发状态: 持续${this.duration}回合, 效果=${this.effect}`);
        }
        if (context.timing === EffectContext_1.EffectTiming.BEFORE_SKILL) {
            // 设置监听，实际触发需要在Miss发生时调用
        }
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            if (attacker.effectCounters?.['on_opponent_miss']) {
                attacker.effectCounters['on_opponent_miss']--;
                if (attacker.effectCounters['on_opponent_miss'] <= 0) {
                    delete attacker.effectCounters['on_opponent_miss'];
                    results.push(this.createResult(true, 'attacker', 'on_opponent_miss_end', `对方Miss触发状态解除！`, 0));
                    this.log(`对方Miss触发状态解除`);
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
        if (!params.effect) {
            this.log('effect必须指定', 'error');
            return false;
        }
        return true;
    }
}
exports.OnOpponentMiss = OnOpponentMiss;
class OnEvadeBoost extends BaseAtomicEffect_1.BaseAtomicEffect {
    duration;
    chance;
    statIndex;
    boostLevel;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'OnEvadeBoost', []);
        this.duration = params.duration;
        this.chance = params.chance;
        this.statIndex = params.statIndex;
        this.boostLevel = params.boostLevel;
    }
    validate(params) {
        return this.duration > 0 && this.chance > 0 && this.chance <= 1;
    }
    execute(context) {
        const { attacker } = context;
        const missed = false; // 简化处理
        if (!missed) {
            return [this.createResult(false, 'attacker', 'on_evade_boost', '未闪避攻击')];
        }
        const roll = Math.random();
        if (roll > this.chance) {
            return [this.createResult(false, 'attacker', 'on_evade_boost', `概率判定失败（${(roll * 100).toFixed(1)}% > ${(this.chance * 100).toFixed(1)}%）`)];
        }
        if (!attacker.battleLevels) {
            attacker.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        const beforeLevel = attacker.battleLevels[this.statIndex];
        attacker.battleLevels[this.statIndex] = Math.min(6, beforeLevel + this.boostLevel);
        const actualBoost = attacker.battleLevels[this.statIndex] - beforeLevel;
        const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
        return [this.createResult(actualBoost > 0, 'attacker', 'on_evade_boost', `闪避提升${statNames[this.statIndex]}（+${actualBoost}）`, actualBoost, { statIndex: this.statIndex, boostLevel: actualBoost, duration: this.duration })];
    }
}
exports.OnEvadeBoost = OnEvadeBoost;
class DelayedKill extends BaseAtomicEffect_1.BaseAtomicEffect {
    delay;
    canBeHealed;
    constructor(params) {
        super(IAtomicEffect_1.AtomicEffectType.SPECIAL, 'DelayedKill', [EffectContext_1.EffectTiming.AFTER_SKILL, EffectContext_1.EffectTiming.TURN_END, EffectContext_1.EffectTiming.ON_HP_CHANGE]);
        this.delay = params.delay;
        this.canBeHealed = params.canBeHealed ?? false;
    }
    execute(context) {
        const results = [];
        const defender = this.getDefender(context);
        if (__ubFatal(defender)) return results;
        if (context.timing === EffectContext_1.EffectTiming.AFTER_SKILL) {
            const killState = this.getKillState(defender);
            killState.isActive = true;
            killState.remainingTurns = this.delay;
            killState.canBeHealed = this.canBeHealed;
            results.push(this.createResult(true, 'defender', 'delayed_kill_set', `被施加了延迟秒杀！${this.delay}回合后将被击倒`, this.delay));
            this.log(`延迟秒杀设置: ${this.delay}回合后击倒`);
        }
        if (context.timing === EffectContext_1.EffectTiming.TURN_END) {
            const killState = this.getKillState(defender);
            if (killState.isActive) {
                killState.remainingTurns--;
                if (killState.remainingTurns > 0) {
                    results.push(this.createResult(true, 'defender', 'delayed_kill_countdown', `延迟秒杀倒计时：${killState.remainingTurns}回合`, killState.remainingTurns));
                }
                else {
                    defender.hp = 0;
                    killState.isActive = false;
                    results.push(this.createResult(true, 'defender', 'delayed_kill_execute', `延迟秒杀生效！被击倒了`, 0));
                    this.log(`延迟秒杀生效: 目标被击倒`);
                }
            }
        }
        if (context.timing === EffectContext_1.EffectTiming.ON_HP_CHANGE && this.canBeHealed) {
            const killState = this.getKillState(defender);
            if (killState.isActive) {
                const currentHp = defender.hp ?? 0;
                const maxHp = defender.maxHp ?? 0;
                if (currentHp >= maxHp) {
                    killState.isActive = false;
                    results.push(this.createResult(true, 'defender', 'delayed_kill_removed', `延迟秒杀被解除了！`, 0));
                    this.log(`延迟秒杀解除: HP回满`);
                }
            }
        }
        return results;
    }
    validate(params) {
        if (params.delay === undefined || params.delay < 1) {
            this.log('delay必须至少为1', 'error');
            return false;
        }
        return true;
    }
    getKillState(pet) {
        if (!pet.effectStates) {
            pet.effectStates = {};
        }
        if (!pet.effectStates.delayedKill) {
            pet.effectStates.delayedKill = {
                remainingTurns: 0,
                isActive: false,
                canBeHealed: false
            };
        }
        return pet.effectStates.delayedKill;
    }
}
exports.DelayedKill = DelayedKill;
//# sourceMappingURL=TriggerEffects.js.map
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
