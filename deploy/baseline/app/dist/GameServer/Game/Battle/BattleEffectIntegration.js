"use strict";
/**
 * 战斗效果集成系统
 *
 * 负责在战斗流程的各个时机触发两类效果：
 * 1. 技能效果 — 由 EffectTrigger 从 skill.sideEffect 驱动
 * 2. 被动特性 — 由 PassiveEffectRunner 从 pet.effectCounters 驱动
 *
 * 触发时机（共29个）：
 * - BATTLE_START / BATTLE_END
 * - TURN_START / TURN_END
 * - ATTACK_START                          — 出手流程开始（异常扣血在此）
 * - BEFORE_SKILL / AFTER_SKILL
 * - BEFORE_SPEED_CHECK
 * - BEFORE_HIT_CHECK / HIT_CHECK / AFTER_HIT_CHECK
 * - ON_HIT                                — 命中时（需命中才触发，技能效果结算前）
 * - SKILL_EFFECT                           — 即时技能效果结算（命中后，伤害计算前）
 * - BEFORE_CRIT_CHECK / CRIT_CHECK
 * - BEFORE_DAMAGE_CALC / AFTER_DAMAGE_CALC
 * - BEFORE_DAMAGE_APPLY / AFTER_DAMAGE_APPLY
 * - ON_HP_CHANGE / ON_ATTACKED / ON_ATTACK
 * - ON_KO / AFTER_KO
 * - ON_RECEIVE_DAMAGE / ON_EVADE
 * - ATTACK_END                             — 出手流程结束时（单次攻击结束）
 * - AFTER_ATTACK_END                       — 出手流程结束后（双方攻击都完成后）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleEffectIntegration = void 0;
const utils_1 = require("../../../shared/utils");
const EffectContext_1 = require("./effects/core/EffectContext");
const EffectTrigger_1 = require("./EffectTrigger");
const EffectPriority_1 = require("./effects/core/EffectPriority");
const PassiveEffectRunner_1 = require("./PassiveEffectRunner");
const BattleCore_1 = require("./BattleCore");
const SkillEffectsConfig_1 = require("../../../shared/config/game/SkillEffectsConfig");
const OnHitMultiStatChangeEffect_1 = require("./effects/atomic/special/OnHitMultiStatChangeEffect");
const EffectResultType = {
    DAMAGE_FLOOR: 'damage_floor',
    DAMAGE_CAP: 'damage_cap',
    DAMAGE_REDUCTION: 'damage_reduction',
    FIXED_DAMAGE_REDUCTION: 'fixed_damage_reduction',
    LOW_HP_PRIORITY: 'low_hp_priority',
    NEXT_TURN_PRIORITY: 'next_turn_priority',
    LOW_HP_OHKO: 'low_hp_ohko',
    PRIORITY_CHANGE: 'priority_change'
};
const EffectCounterKey = {
    REGENERATION: 'regeneration',
    LEECH_SEED: 'leech_seed',
    DELAYED_FULL_HEAL: 'delayed_full_heal'
};
const OnHitMultiStatChangeSpecialType = 'on_hit_multi_stat_change';
const SpeedAlwaysFirstResultTypes = new Set([
    EffectResultType.LOW_HP_PRIORITY,
    EffectResultType.NEXT_TURN_PRIORITY
]);
const SpeedPriorityModResultTypes = new Set([
    EffectResultType.LOW_HP_OHKO,
    EffectResultType.PRIORITY_CHANGE
]);
const TemporaryStatBoostPattern = /^stat_(\d+)_boost_(-?\d+)$/;
// ==================== 辅助函数 ====================
/**
 * 触发双方被动特性
 *
 * 在每个时机同时检查攻击方和防守方的被动特性。
 * PassiveEffectRunner 内部通过 role 过滤只触发匹配的特性。
 */
function triggerBothPassives(attacker, defender, timing, skill, damage, turn) {
    const ctx = { attacker, defender, skill, damage, turn };
    // 触发攻击方的被动特性（如自身命中/暴击/伤害增强等）
    const attackerResults = PassiveEffectRunner_1.PassiveEffectRunner.TriggerAtTiming(attacker, defender, timing, ctx);
    // 触发防守方的被动特性（如伤害减免/反弹/吸收等）
    const defenderResults = PassiveEffectRunner_1.PassiveEffectRunner.TriggerAtTiming(defender, attacker, timing, ctx);
    return [...attackerResults, ...defenderResults];
}
/**
 * 触发宠物自身的被动特性（回合级别，不区分攻守）
 */
function triggerOwnPassives(pet, opponent, timing, turn) {
    // 回合级别时机，pet 既是 attacker 也是 defender 概念不适用
    // 传入 pet 作为 attacker 以保持一致，role='any' 的特性都会触发
    const ctx = { attacker: pet, defender: opponent, turn };
    return PassiveEffectRunner_1.PassiveEffectRunner.TriggerAtTiming(pet, opponent, timing, ctx);
}
// ==================== 主类 ====================
/**
 * 战斗效果集成器
 */
class BattleEffectIntegration {
    // ==================== 通用触发方法 ====================
    /**
     * 通用时机触发：技能效果 + 双方被动特性
     * 大部分时机（BEFORE_SKILL, ON_HIT, ON_KO 等）共享此流程
     */
    static TriggerAtTiming(attacker, defender, skill, timing, damage = 0) {
        const results = [];
        const skillResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(skill, attacker, defender, damage, timing);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
        results.push(...skillResults);
        const passiveResults = triggerBothPassives(attacker, defender, timing, skill, damage);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
        results.push(...passiveResults);
        return results;
    }
    static GetResultType(result) {
        return result.effectType || result.type;
    }
    static CollectSpeedModifiers(results) {
        let alwaysFirst = false;
        let priorityMod = 0;
        for (const result of results) {
            if (!result.success)
                continue;
            const resultType = this.GetResultType(result);
            if (SpeedAlwaysFirstResultTypes.has(resultType)) {
                alwaysFirst = true;
            }
            if (result.value !== undefined && SpeedPriorityModResultTypes.has(resultType)) {
                priorityMod += result.value;
            }
        }
        return { alwaysFirst, priorityMod };
    }
    static ApplyAfterDamageCalcResult(baseDamage, currentDamage, result) {
        if (!result.success || result.value === undefined) {
            return currentDamage;
        }
        const resultType = this.GetResultType(result);
        if (resultType === EffectResultType.DAMAGE_FLOOR) {
            const nextDamage = Math.max(currentDamage, result.value);
            utils_1.Logger.Debug(`[BattleEffectIntegration] 搴旂敤浼ゅ涓嬮檺: ${baseDamage} 鈫?${nextDamage}`);
            return nextDamage;
        }
        if (resultType === EffectResultType.DAMAGE_CAP) {
            const nextDamage = Math.min(currentDamage, result.value);
            utils_1.Logger.Debug(`[BattleEffectIntegration] 搴旂敤浼ゅ涓婇檺: ${baseDamage} 鈫?${nextDamage}`);
            return nextDamage;
        }
        if (resultType === EffectResultType.DAMAGE_REDUCTION && result.data?.newDamage !== undefined) {
            const nextDamage = result.data.newDamage;
            utils_1.Logger.Debug(`[BattleEffectIntegration] 琚姩浼ゅ鍑忓厤: ${baseDamage} 鈫?${nextDamage}`);
            return nextDamage;
        }
        if (result.data?.absorbedDamage !== undefined || resultType === 'immunity') {
            return 0;
        }
        return currentDamage;
    }
    static ApplyBeforeDamageApplyResult(baseDamage, currentDamage, result) {
        if (!result.success || result.value === undefined) {
            return currentDamage;
        }
        const resultType = this.GetResultType(result);
        if (resultType !== EffectResultType.FIXED_DAMAGE_REDUCTION) {
            return currentDamage;
        }
        const nextDamage = Math.max(0, currentDamage - result.value);
        utils_1.Logger.Debug(`[BattleEffectIntegration] 搴旂敤鍥哄畾浼ゅ鍑忓厤: ${baseDamage} 鈫?${nextDamage}`);
        return nextDamage;
    }
    // ==================== 战斗级别时机 ====================
    /**
     * 战斗开始时触发效果
     */
    static OnBattleStart(battle) {
        const results = [];
        utils_1.Logger.Debug(`[BattleEffectIntegration] 战斗开始`);
        // 技能效果
        if (battle.player.skills && battle.player.skills.length > 0) {
            const playerSkill = { id: 0, name: '战斗开始', category: 3, type: 0, power: 0, maxPP: 0, accuracy: 100, critRate: 0, priority: 0, mustHit: false };
            const playerResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(playerSkill, battle.player, battle.enemy, 0, EffectContext_1.EffectTiming.BATTLE_START);
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(playerResults, battle.player, battle.enemy);
            results.push(...playerResults);
        }
        if (battle.enemy.skills && battle.enemy.skills.length > 0) {
            const enemySkill = { id: 0, name: '战斗开始', category: 3, type: 0, power: 0, maxPP: 0, accuracy: 100, critRate: 0, priority: 0, mustHit: false };
            const enemyResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(enemySkill, battle.enemy, battle.player, 0, EffectContext_1.EffectTiming.BATTLE_START);
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(enemyResults, battle.enemy, battle.player);
            results.push(...enemyResults);
        }
        // 被动特性（BATTLE_START 时机）
        const playerPassive = triggerOwnPassives(battle.player, battle.enemy, EffectContext_1.EffectTiming.BATTLE_START);
        const enemyPassive = triggerOwnPassives(battle.enemy, battle.player, EffectContext_1.EffectTiming.BATTLE_START);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
        results.push(...playerPassive, ...enemyPassive);
        return results;
    }
    /**
     * 战斗结束时触发效果
     */
    static OnBattleEnd(battle, winnerId) {
        const results = [];
        utils_1.Logger.Debug(`[BattleEffectIntegration] 战斗结束: Winner=${winnerId}`);
        this.CleanupBattleEffects(battle.player);
        this.CleanupBattleEffects(battle.enemy);
        return results;
    }
    // ==================== 回合级别时机 ====================
    /**
     * 回合开始时触发效果
     */
    static OnTurnStart(battle) {
        const results = [];
        const playerResults = this.ProcessTurnStartEffects(battle.player, battle.enemy);
        const enemyResults = this.ProcessTurnStartEffects(battle.enemy, battle.player);
        results.push(...playerResults, ...enemyResults);
        // 被动特性（TURN_START 时机）
        const playerPassive = triggerOwnPassives(battle.player, battle.enemy, EffectContext_1.EffectTiming.TURN_START, battle.turn);
        const enemyPassive = triggerOwnPassives(battle.enemy, battle.player, EffectContext_1.EffectTiming.TURN_START, battle.turn);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
        results.push(...playerPassive, ...enemyPassive);
        // 递减状态和效果计数器
        this.DecrementStatusDurations(battle.player);
        this.DecrementStatusDurations(battle.enemy);
        this.DecrementEffectCounters(battle.player);
        this.DecrementEffectCounters(battle.enemy);
        return results;
    }
    /**
     * 回合结束时触发效果
     */
    static OnTurnEnd(battle) {
        // 异常状态扣血（回合结束时）
        this.ApplyTurnStartStatusDamage(battle.player);
        this.ApplyTurnStartStatusDamage(battle.enemy);
        const results = [];
        // 只在有效果时才输出日志
        // 技能持续效果
        const playerResults = this.ProcessTurnEndEffects(battle.player, battle.enemy);
        const enemyResults = this.ProcessTurnEndEffects(battle.enemy, battle.player);
        results.push(...playerResults, ...enemyResults);
        // 被动特性（TURN_END 时机）
        const playerPassive = triggerOwnPassives(battle.player, battle.enemy, EffectContext_1.EffectTiming.TURN_END, battle.turn);
        const enemyPassive = triggerOwnPassives(battle.enemy, battle.player, EffectContext_1.EffectTiming.TURN_END, battle.turn);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
        results.push(...playerPassive, ...enemyPassive);
        return results;
    }
    // ==================== 速度判定时机 ====================
    /**
     * 速度判定前触发效果
     * 返回结构化的速度修正信息，包含双方的 alwaysFirst 和 priorityModifier
     */
    static OnBeforeSpeedCheck(attacker, defender, attackerSkill, defenderSkill) {
        const results = [];
        // 攻击方技能效果
        const attackerResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(attackerSkill, attacker, defender, 0, EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(attackerResults, attacker, defender);
        results.push(...attackerResults);
        // 防守方技能效果
        const defenderResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(defenderSkill, defender, attacker, 0, EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(defenderResults, defender, attacker);
        results.push(...defenderResults);
        // 被动特性 — 分别为双方创建独立 context，以区分谁设置了 alwaysFirst/priorityModifier
        const attackerCtx = { attacker, defender, skill: attackerSkill };
        const defenderCtx = { attacker: defender, defender: attacker, skill: defenderSkill };
        // 攻击方被动：owner=attacker, opponent=defender
        const attackerPassiveResults = PassiveEffectRunner_1.PassiveEffectRunner.TriggerAtTiming(attacker, defender, EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK, attackerCtx);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(attackerPassiveResults, attacker, defender);
        results.push(...attackerPassiveResults);
        // 防守方被动：owner=defender, opponent=attacker
        const defenderPassiveResults = PassiveEffectRunner_1.PassiveEffectRunner.TriggerAtTiming(defender, attacker, EffectContext_1.EffectTiming.BEFORE_SPEED_CHECK, defenderCtx);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(defenderPassiveResults, defender, attacker);
        results.push(...defenderPassiveResults);
        const attackerModifier = this.CollectSpeedModifiers(attackerPassiveResults);
        const defenderModifier = this.CollectSpeedModifiers(defenderPassiveResults);
        // Skill priority atoms report absolute values; only the change is added to the skill's own priority.
        const priorityChange = (items) => items.reduce((sum, r) => r.success && r.type === 'priority_modifier' && r.data ? sum + r.data.newPriority - r.data.oldPriority : sum, 0);
        attackerModifier.priorityMod += priorityChange(attackerResults);
        defenderModifier.priorityMod += priorityChange(defenderResults);
        return {
            results,
            playerAlwaysFirst: attackerModifier.alwaysFirst,
            playerPriorityMod: attackerModifier.priorityMod,
            enemyAlwaysFirst: defenderModifier.alwaysFirst,
            enemyPriorityMod: defenderModifier.priorityMod,
        };
    }
    // ==================== 技能使用时机 ====================
    /**
     * 技能使用前触发效果
     */
    static OnBeforeSkill(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.BEFORE_SKILL);
    }
    /**
     * 技能使用后触发效果
     */
    static OnAfterSkill(attacker, defender, skill, damage) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.AFTER_SKILL, damage);
    }
    // ==================== 命中判定时机 ====================
    /**
     * 命中判定前触发效果
     */
    static OnBeforeHitCheck(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.BEFORE_HIT_CHECK);
    }
    /**
     * 命中判定时触发效果
     */
    static OnHitCheck(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.HIT_CHECK);
    }
    /**
     * 命中判定后触发效果
     */
    static OnAfterHitCheck(attacker, defender, skill, hit) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.AFTER_HIT_CHECK);
    }
    // ==================== 暴击判定时机 ====================
    /**
     * 暴击判定前触发效果
     */
    static OnBeforeCritCheck(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.BEFORE_CRIT_CHECK);
    }
    /**
     * 暴击判定时触发效果
     */
    static OnCritCheck(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.CRIT_CHECK);
    }
    // ==================== 伤害计算时机 ====================
    /**
     * 伤害计算前触发效果
     */
    static OnBeforeDamageCalc(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.BEFORE_DAMAGE_CALC);
    }
    /**
     * 伤害计算后触发效果
     *
     * 关键时机：BOSS被动的伤害减免、同系吸收、属性免疫在此触发
     */
    static OnAfterDamageCalc(attacker, defender, skill, damage) {
        let results = [];
        let modifiedDamage = damage;
        utils_1.Logger.Debug(`[BattleEffectIntegration] 伤害计算后: Damage=${damage}`);
        // 1. 技能效果
        const skillResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(skill, attacker, defender, damage, EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC);
        // 2. 被动特性（伤害减免、同系吸收、属性免疫等）
        const passiveResults = triggerBothPassives(attacker, defender, EffectContext_1.EffectTiming.AFTER_DAMAGE_CALC, skill, damage);
        // 合并并解决冲突
        const allResults = [...skillResults, ...passiveResults];
        results = EffectPriority_1.EffectConflictResolver.ResolveConflicts(allResults);
        // 应用伤害修正
        for (const result of results) {
            modifiedDamage = this.ApplyAfterDamageCalcResult(damage, modifiedDamage, result);
        }
        if (results.length > 0) {
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(results, attacker, defender);
        }
        return { damage: modifiedDamage, results };
    }
    // ==================== 伤害应用时机 ====================
    /**
     * 伤害应用前触发效果
     */
    static OnBeforeDamageApply(attacker, defender, skill, damage) {
        const results = [];
        let modifiedDamage = damage;
        utils_1.Logger.Debug(`[BattleEffectIntegration] 伤害应用前: Damage=${damage}`);
        // 技能效果
        const skillResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(skill, attacker, defender, damage, EffectContext_1.EffectTiming.BEFORE_DAMAGE_APPLY);
        results.push(...skillResults);
        // 被动特性（如致死保护、概率抵挡等）
        const passiveResults = triggerBothPassives(attacker, defender, EffectContext_1.EffectTiming.BEFORE_DAMAGE_APPLY, skill, damage);
        results.push(...passiveResults);
        // 应用伤害减免
        const allResults = [...skillResults, ...passiveResults];
        for (const result of allResults) {
            modifiedDamage = this.ApplyBeforeDamageApplyResult(damage, modifiedDamage, result);
        }
        if (allResults.length > 0) {
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(allResults, attacker, defender);
        }
        return { damage: modifiedDamage, results };
    }
    /**
     * 伤害应用后触发效果
     */
    static OnAfterDamageApply(attacker, defender, skill, damage) {
        const results = this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.AFTER_DAMAGE_APPLY, damage);
        const counterResults = this.TriggerOnHitCounterEffects(attacker, defender, damage);
        if (counterResults.length > 0) {
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(counterResults, attacker, defender);
            results.push(...counterResults);
        }
        return results;
    }
    // ==================== 受击/攻击时机 ====================
    /**
     * 受到攻击时触发效果
     */
    static OnAttacked(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.ON_ATTACKED);
    }
    /**
     * 攻击时触发效果
     */
    static OnAttack(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.ON_ATTACK);
    }
    /**
     * 受到伤害时触发效果
     */
    static OnReceiveDamage(attacker, defender, skill, damage) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.ON_RECEIVE_DAMAGE, damage);
    }
    // ==================== 击败时机 ====================
    /**
     * 击败对手时触发效果
     */
    static OnKO(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.ON_KO);
    }
    /**
     * 击败对方后触发效果
     */
    static OnAfterKO(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.AFTER_KO);
    }
    // ==================== HP变化时机 ====================
    /**
     * HP变化时触发效果
     */
    static OnHPChange(pet, opponent, oldHP, newHP) {
        const results = [];
        utils_1.Logger.Debug(`[BattleEffectIntegration] HP变化: ${pet.name} ${oldHP} → ${newHP}`);
        const dummySkill = { id: 0, name: 'HP变化', category: 3, type: 0, power: 0, maxPP: 0, accuracy: 100, critRate: 0, priority: 0, mustHit: false };
        const hpDelta = Math.abs(newHP - oldHP);
        const skillResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(dummySkill, pet, opponent, hpDelta, EffectContext_1.EffectTiming.ON_HP_CHANGE);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(skillResults, pet, opponent);
        results.push(...skillResults);
        // 被动特性（如HP阈值触发）
        const passiveResults = triggerOwnPassives(pet, opponent, EffectContext_1.EffectTiming.ON_HP_CHANGE);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(passiveResults, pet, opponent);
        results.push(...passiveResults);
        return results;
    }
    // ==================== 闪避时机 ====================
    /**
     * 闪避时触发效果
     */
    static OnEvade(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.ON_EVADE);
    }
    // ==================== 出手流程时机（9阶段） ====================
    /**
     * 阶段1: 出手流程开始
     * - 处理 defender 身上的异常扣血（先手方挂在对手身上的异常先生效）
     * - 触发 ATTACK_START 时机的被动/技能效果
     *
     * @returns 包含状态伤害值的效果结果
     */
    static OnAttackStart(attacker, defender, skill) {
        const results = [];
        utils_1.Logger.Debug(`[BattleEffectIntegration] 出手流程开始: ${attacker.name} → ${defender.name}`);
        // 处理 defender 身上的异常扣血
        const statusDamage = 0;
        const skillResults = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(skill, attacker, defender, 0, EffectContext_1.EffectTiming.ATTACK_START);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(skillResults, attacker, defender);
        results.push(...skillResults);
        // 被动特性
        const passiveResults = triggerBothPassives(attacker, defender, EffectContext_1.EffectTiming.ATTACK_START, skill);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(passiveResults, attacker, defender);
        results.push(...passiveResults);
        return { statusDamage, results };
    }
    /**
     * 阶段3: 命中时
     */
    static OnHit(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.ON_HIT);
    }
    /**
     * 阶段4: 即时技能效果结算
     */
    static OnSkillEffect(attacker, defender, skill) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.SKILL_EFFECT);
    }
    /**
     * 阶段8: 出手流程结束时
     */
    static OnAttackEnd(attacker, defender, skill, damage) {
        return this.TriggerAtTiming(attacker, defender, skill, EffectContext_1.EffectTiming.ATTACK_END, damage);
    }
    /**
     * 阶段9: 出手流程结束后
     * - 双方攻击都完成后触发
     * - 击杀控、星皇之赐等效果在此触发
     */
    static OnAfterAttackEnd(battle) {
        const results = [];
        utils_1.Logger.Debug(`[BattleEffectIntegration] 出手流程结束后（双方攻击完成）`);
        // 玩家侧被动特性
        const playerPassive = triggerOwnPassives(battle.player, battle.enemy, EffectContext_1.EffectTiming.AFTER_ATTACK_END, battle.turn);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(playerPassive, battle.player, battle.enemy);
        results.push(...playerPassive);
        // 敌方侧被动特性
        const enemyPassive = triggerOwnPassives(battle.enemy, battle.player, EffectContext_1.EffectTiming.AFTER_ATTACK_END, battle.turn);
        EffectTrigger_1.EffectTrigger.ApplyEffectResults(enemyPassive, battle.enemy, battle.player);
        results.push(...enemyPassive);
        return results;
    }
    // ==================== 内部辅助方法 ====================
    /**
     * 处理回合开始效果
     */
    static GetOnHitMultiStatChangeAtom(effectId) {
        const effectConfig = SkillEffectsConfig_1.SkillEffectsConfig.Instance.GetEffectById(effectId);
        if (!effectConfig?.atomicComposition?.atoms) {
            return null;
        }
        for (const atom of effectConfig.atomicComposition.atoms) {
            if (atom?.specialType === OnHitMultiStatChangeSpecialType) {
                return atom;
            }
        }
        return null;
    }
    static TriggerOnHitCounterEffects(attacker, defender, damage) {
        if (damage <= 0 || !defender.effectCounters) {
            return [];
        }
        const results = [];
        for (const [counterKey, counterValue] of Object.entries(defender.effectCounters)) {
            if (!counterKey.startsWith(OnHitMultiStatChangeEffect_1.ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX)) {
                continue;
            }
            if (typeof counterValue !== 'number' || counterValue <= 0) {
                continue;
            }
            const effectId = parseInt(counterKey.slice(OnHitMultiStatChangeEffect_1.ON_HIT_MULTI_STAT_CHANGE_COUNTER_PREFIX.length), 10);
            if (!Number.isFinite(effectId) || effectId <= 0) {
                continue;
            }
            const atom = this.GetOnHitMultiStatChangeAtom(effectId);
            if (!atom || !Array.isArray(atom.statChanges)) {
                continue;
            }
            if (atom.probability !== undefined && !EffectTrigger_1.EffectTrigger.ShouldTrigger(atom.probability)) {
                continue;
            }
            const targetPet = atom.targetSelf === true ? defender : attacker;
            const target = targetPet === attacker ? 'attacker' : 'defender';
            for (const statChange of atom.statChanges) {
                if (typeof statChange?.stat !== 'number' || typeof statChange?.change !== 'number') {
                    continue;
                }
                results.push({
                    effectId,
                    effectName: OnHitMultiStatChangeSpecialType,
                    success: true,
                    target,
                    type: 'stat_change',
                    value: statChange.change,
                    message: 'on-hit multi stat change triggered',
                    data: {
                        stat: statChange.stat,
                        stages: statChange.change
                    }
                });
            }
        }
        return results;
    }
    static ApplyTurnStartStatusDamage(pet) {
        const statusDamage = BattleCore_1.BattleCore.ProcessStatusEffects(pet);
        if (statusDamage <= 0) {
            return;
        }
        const oldHp = pet.hp;
        const budget = require("./UniverseBossBudget"), battle = budget.battleFor(pet);
        pet.hp = Math.max(0, pet.hp - budget.damage(battle, battle?.player, pet, "dot", statusDamage));
        utils_1.Logger.Info(`[BattleEffectIntegration] TurnStart status damage: ${pet.name} ${oldHp} -> ${pet.hp} (-${statusDamage})`);
    }
    static ProcessTurnStartEffects(pet, _opponent) {
        const results = [];
        // 处理持续回复
        if (pet.effectCounters && pet.effectCounters[EffectCounterKey.REGENERATION]) {
            const healAmount = Math.floor(pet.maxHp * 0.0625); // 1/16 HP
            const budget = require("./UniverseBossBudget"), battle = budget.battleFor(pet);
            if (battle) budget.heal(battle, pet, healAmount); else pet.hp = Math.min(pet.maxHp, pet.hp + healAmount);
            utils_1.Logger.Debug(`[BattleEffectIntegration] 持续回复: ${pet.name} +${healAmount}HP`);
        }
        // 处理持续伤害（中毒、烧伤等）
        return results;
    }
    /**
     * 处理回合结束效果
     */
    static ProcessTurnEndEffects(pet, opponent) {
        const results = [];
        // 处理寄生种子
        if (pet.effectCounters && pet.effectCounters[EffectCounterKey.LEECH_SEED]) {
            const drainAmount = Math.floor(pet.maxHp * 0.125); // 1/8 HP
            const budget = require("./UniverseBossBudget"), battle = budget.battleFor(pet), before = pet.hp;
            pet.hp = Math.max(0, pet.hp - budget.damage(battle, opponent, pet, "dot", drainAmount));
            if (battle) budget.heal(battle, opponent, before - pet.hp); else opponent.hp = Math.min(opponent.maxHp, opponent.hp + drainAmount);
            utils_1.Logger.Debug(`[BattleEffectIntegration] 寄生种子: ${pet.name} -${drainAmount}HP, ` +
                `${opponent.name} +${drainAmount}HP`);
        }
        return results;
    }
    /**
     * 递减状态持续时间
     */
    static DecrementStatusDurations(pet) {
        if (!pet.statusDurations)
            return;
        const coreManagedStatuses = new Set([
            BattleCore_1.BattleStatusType.PARALYSIS,
            BattleCore_1.BattleStatusType.POISON,
            BattleCore_1.BattleStatusType.BURN,
            BattleCore_1.BattleStatusType.DRAIN,
            BattleCore_1.BattleStatusType.FREEZE,
            BattleCore_1.BattleStatusType.FEAR,
            BattleCore_1.BattleStatusType.SLEEP,
            BattleCore_1.BattleStatusType.PETRIFY,
            BattleCore_1.BattleStatusType.CONFUSION,
            BattleCore_1.BattleStatusType.ICE_SEAL,
            BattleCore_1.BattleStatusType.BLEED,
            BattleCore_1.BattleStatusType.FATIGUE
        ]);
        for (let i = 0; i < pet.statusDurations.length; i++) {
            if (pet.statusDurations[i] <= 0)
                continue;
            if (coreManagedStatuses.has(i))
                continue;
            pet.statusDurations[i]--;
            if (pet.statusDurations[i] === 0 && pet.status === i) {
                pet.status = undefined;
                utils_1.Logger.Debug(`[BattleEffectIntegration] 状态结束: ${pet.name}, status=${i}`);
            }
        }
        if (pet.status !== undefined && pet.status !== null) {
            const current = pet.status;
            if (current >= 0 && current < pet.statusDurations.length && pet.statusDurations[current] <= 0) {
                pet.status = undefined;
            }
        }
    }
    /**
     * 递减效果计数器
     */
    static DecrementEffectCounters(pet) {
        if (!pet.effectCounters)
            return;
        const expiredEffects = [];
        for (const [key, value] of Object.entries(pet.effectCounters)) {
            // 跳过被动特性存储和非数字值
            if (key === PassiveEffectRunner_1.REGISTERED_PASSIVES_KEY)
                continue;
            if (typeof value !== 'number' || value <= 0)
                continue;
            pet.effectCounters[key] = value - 1;
            if (pet.effectCounters[key] === 0) {
                expiredEffects.push(key);
            }
        }
        // 处理过期效果
        for (const key of expiredEffects) {
            this.HandleExpiredEffect(pet, key);
            delete pet.effectCounters[key];
        }
    }
    /**
     * 处理单个过期效果
     */
    static HandleExpiredEffect(pet, effectKey) {
        // 延迟全回复（誓言之约等技能）
        if (effectKey === EffectCounterKey.DELAYED_FULL_HEAL) {
            const oldHp = pet.hp;
            const budget = require("./UniverseBossBudget"), battle = budget.battleFor(pet);
            if (battle) budget.heal(battle, pet, pet.maxHp - pet.hp); else pet.hp = pet.maxHp;
            utils_1.Logger.Info(`[BattleEffectIntegration] 延迟全回复触发: ${pet.name}, ` +
                `HP ${oldHp}/${pet.maxHp} → ${pet.maxHp}/${pet.maxHp}`);
            return;
        }
        // 临时能力变化
        const statBoostMatch = effectKey.match(TemporaryStatBoostPattern);
        if (statBoostMatch) {
            if (pet.battleLv) {
                const statIndex = parseInt(statBoostMatch[1], 10);
                const stages = parseInt(statBoostMatch[2], 10);
                const oldStage = pet.battleLv[statIndex] || 0;
                const newStage = Math.max(-6, Math.min(6, oldStage - stages));
                pet.battleLv[statIndex] = newStage;
                const statNames = ['攻击', '防御', '特攻', '特防', '速度', '命中'];
                utils_1.Logger.Info(`[BattleEffectIntegration] 临时能力变化结束: ${pet.name}, ` +
                    `${statNames[statIndex]} ${oldStage} → ${newStage}`);
            }
            return;
        }
        // 其他效果
        utils_1.Logger.Debug(`[BattleEffectIntegration] 效果结束: ${pet.name}, effect=${effectKey}`);
    }
    /**
     * 清理战斗效果
     */
    static CleanupBattleEffects(pet) {
        if (pet.battleLevels) {
            pet.battleLevels = [0, 0, 0, 0, 0, 0];
        }
        if (pet.effectCounters) {
            pet.effectCounters = {};
        }
        if (pet.statusDurations) {
            pet.statusDurations = new Array(20).fill(0);
        }
        if (pet.immuneFlags) {
            pet.immuneFlags = {};
        }
        utils_1.Logger.Debug(`[BattleEffectIntegration] 清理战斗效果: ${pet.name}`);
    }
}
exports.BattleEffectIntegration = BattleEffectIntegration;
//# sourceMappingURL=BattleEffectIntegration.js.map