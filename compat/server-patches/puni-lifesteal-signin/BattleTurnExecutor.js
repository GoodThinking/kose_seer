"use strict";
/**
 * 战斗回合执行器
 * 负责执行完整的战斗回合逻辑
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua (executeTurn)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleTurnExecutor = void 0;
const utils_1 = require("../../../shared/utils");
const BattleCore_1 = require("./BattleCore");
const EffectTrigger_1 = require("./EffectTrigger");
const EffectContext_1 = require("./effects/core/EffectContext");
const BattleEffectIntegration_1 = require("./BattleEffectIntegration");
const BossSpecialRules_1 = require("./BossSpecialRules");
const SkillEffectRuntime_1 = require("./SkillEffectRuntime");
const PuniSealBattle_1 = require("./PuniSealBattle");
/**
 * 战斗回合执行器类
 */
class BattleTurnExecutor {
    /**
     * 执行一个完整的战斗回合（统一 PvE/PvP）
     *
     * @param battle 战斗实例
     * @param pet1SkillId 玩家1/己方选择的技能ID
     * @param pet2SkillId 敌方/玩家2的技能ID（PvE时由caller传AI选的技能，PvP时由玩家指定；0=换精灵不攻击）
     * @param skillConfigs 技能配置Map
     * @param options 选项（isPvp、pet2UserId）
     * @returns 回合结果
     */
    static ExecuteTurn(battle, pet1SkillId, pet2SkillId, skillConfigs, options = {}) {
        const isPvp = options.isPvp === true;
        const pet2UserId = options.pet2UserId ?? 0;
        utils_1.Logger.Info(`\n========== ${isPvp ? 'PVP ' : ''}回合 ${battle.turn} ==========`);
        utils_1.Logger.Info(`${isPvp ? '玩家1' : '玩家'}: ${battle.player.name} HP=${battle.player.hp}/${battle.player.maxHp}`);
        utils_1.Logger.Info(`${isPvp ? '玩家2' : '敌人'}: ${battle.enemy.name} HP=${battle.enemy.hp}/${battle.enemy.maxHp}`);
        // ==================== 回合开始效果 ====================
        const turnStartResults = BattleEffectIntegration_1.BattleEffectIntegration.OnTurnStart(battle);
        SkillEffectRuntime_1.SkillEffectRuntime.OnEntry(battle);
        BossSpecialRules_1.BossSpecialRules.SettleBossHp(battle, 'dot');
        if (turnStartResults.length > 0) {
            utils_1.Logger.Info(`[${isPvp ? 'PVP' : ''}回合开始] 触发了${turnStartResults.length}个效果`);
        }
        // 检查回合开始效果是否导致死亡
        if (battle.player.hp <= 0) {
            utils_1.Logger.Info(`[回合开始] ${isPvp ? '玩家1' : '玩家'}精灵阵亡，等待切换精灵`);
            return { isOver: false, winner: undefined, reason: 0 };
        }
        if (battle.enemy.hp <= 0) {
            utils_1.Logger.Info(`[回合开始] ${isPvp ? '玩家2' : '敌人'}精灵阵亡，${isPvp ? '玩家1' : '玩家'}胜利`);
            battle.isOver = true;
            return { isOver: true, winner: battle.userId, reason: 0 };
        }
        // 获取技能配置
        // PvP中 skillId=0 表示换精灵，使用 GetNoActionSkill
        const pet1Skill = options.playerIdle ? this.GetNoActionSkill() : require("../Pet/Countermarks").Skill(battle.player, pet1SkillId > 0
            ? (skillConfigs.get(pet1SkillId) || this.GetDefaultSkill())
            : (isPvp ? this.GetNoActionSkill() : (skillConfigs.get(pet1SkillId) || this.GetDefaultSkill())));
        const pet2Skill = require("../Pet/Countermarks").Skill(battle.enemy, pet2SkillId > 0
            ? (skillConfigs.get(pet2SkillId) || this.GetDefaultSkill())
            : ((isPvp || battle.enemy.bossMechanics) ? this.GetNoActionSkill() : (skillConfigs.get(pet2SkillId) || this.GetDefaultSkill())));
        utils_1.Logger.Info(`${isPvp ? '玩家1' : '玩家'}技能: ${pet1Skill.name} | ${isPvp ? '玩家2' : '敌人'}技能: ${pet2Skill.name}`);
        // 回合开始时的克制/持续效果
        this.ProcessTurnStartEffects(battle, pet1Skill, pet2Skill);
        // 检查是否可以行动
        // PvP中 skillId=0 表示换精灵，不攻击
        const pet1CanAct = () => options.playerIdle ? this.IdleCanAct(battle) : (SkillEffectRuntime_1.SkillEffectRuntime.CanAct(battle, battle.player, pet1Skill) ?? ((isPvp && pet1SkillId === 0)
            ? { canAct: false, reason: 'changePet' }
            : BattleCore_1.BattleCore.CanAct(battle.player)));
        const pet2CanAct = () => SkillEffectRuntime_1.SkillEffectRuntime.CanAct(battle, battle.enemy, pet2Skill) ?? (((isPvp || battle.enemy.bossMechanics) && pet2SkillId === 0)
            ? { canAct: false, reason: 'changePet' }
            : BattleCore_1.BattleCore.CanAct(battle.enemy));
        // ==================== 速度判定前效果 ====================
        const speedMods = BattleEffectIntegration_1.BattleEffectIntegration.OnBeforeSpeedCheck(battle.player, battle.enemy, pet1Skill, pet2Skill);
        // 决定先后手
        const pet1First = !options.playerIdle && BattleCore_1.BattleCore.CompareSpeed(battle.player, battle.enemy, pet1Skill, pet2Skill, {
            pet1AlwaysFirst: speedMods.playerAlwaysFirst,
            pet2AlwaysFirst: speedMods.enemyAlwaysFirst,
            pet1PriorityMod: speedMods.playerPriorityMod + SkillEffectRuntime_1.SkillEffectRuntime.Priority(battle, battle.player, pet1Skill),
            pet2PriorityMod: speedMods.enemyPriorityMod + SkillEffectRuntime_1.SkillEffectRuntime.Priority(battle, battle.enemy, pet2Skill),
        });
        // ==================== 速度判定日志 ====================
        if (!isPvp) {
            const playerPriority = (pet1Skill.priority || 0) + speedMods.playerPriorityMod;
            const enemyPriority = (pet2Skill.priority || 0) + speedMods.enemyPriorityMod;
            const playerSpeedStage = battle.player.battleLv?.[4] || 0;
            const enemySpeedStage = battle.enemy.battleLv?.[4] || 0;
            utils_1.Logger.Info(`[速度判定] 回合${battle.turn} | ` +
                `玩家[${battle.player.name}]: ` +
                `${speedMods.playerAlwaysFirst ? '✓先制 ' : ''}` +
                `优先度=${playerPriority}(${pet1Skill.priority || 0}${speedMods.playerPriorityMod !== 0 ? `+${speedMods.playerPriorityMod}` : ''}) ` +
                `速度=${battle.player.speed}${playerSpeedStage !== 0 ? `(${playerSpeedStage > 0 ? '+' : ''}${playerSpeedStage})` : ''} | ` +
                `敌人[${battle.enemy.name}]: ` +
                `${speedMods.enemyAlwaysFirst ? '✓先制 ' : ''}` +
                `优先度=${enemyPriority}(${pet2Skill.priority || 0}${speedMods.enemyPriorityMod !== 0 ? `+${speedMods.enemyPriorityMod}` : ''}) ` +
                `速度=${battle.enemy.speed}${enemySpeedStage !== 0 ? `(${enemySpeedStage > 0 ? '+' : ''}${enemySpeedStage})` : ''} | ` +
                `→ ${pet1First ? '玩家先手' : '敌人先手'}`);
        }
        else {
            utils_1.Logger.Info(`[PVP速度判定] 回合${battle.turn} | ` +
                `玩家1[${battle.player.name}]: 速度=${battle.player.speed} | ` +
                `玩家2[${battle.enemy.name}]: 速度=${battle.enemy.speed} | ` +
                `→ ${pet1First ? '玩家1先手' : '玩家2先手'}`);
        }
        // ==================== 执行攻击 ====================
        const result = { isOver: false };
        if (pet1First) {
            // pet1（玩家/玩家1）先攻
            result.firstAttack = this.ExecuteAttack(battle, battle.player, battle.enemy, pet1Skill, battle.userId, pet1CanAct(), true);
            if (battle.enemy.hp <= 0) {
                battle.isOver = true;
                result.isOver = true;
                result.winner = battle.userId;
                result.reason = 0;
            }
            else {
                // pet2（敌人/玩家2）反击
                result.secondAttack = this.ExecuteAttack(battle, battle.enemy, battle.player, pet2Skill, pet2UserId, pet2CanAct(), false);
                if (battle.player.hp <= 0) {
                    utils_1.Logger.Info(`[BattleTurnExecutor] ${isPvp ? '玩家1' : '玩家'}精灵被击败，等待切换精灵`);
                }
            }
        }
        else {
            // pet2（敌人/玩家2）先攻
            result.firstAttack = this.ExecuteAttack(battle, battle.enemy, battle.player, pet2Skill, pet2UserId, pet2CanAct(), true);
            if (battle.player.hp <= 0) {
                utils_1.Logger.Info(`[BattleTurnExecutor] ${isPvp ? '玩家1' : '玩家'}精灵被击败，等待切换精灵`);
            }
            else {
                // pet1（玩家/玩家1）反击
                result.secondAttack = this.ExecuteAttack(battle, battle.player, battle.enemy, pet1Skill, battle.userId, pet1CanAct(), false);
                if (battle.enemy.hp <= 0) {
                    battle.isOver = true;
                    result.isOver = true;
                    result.winner = battle.userId;
                    result.reason = 0;
                }
            }
        }
        // ==================== 阶段9: 出手流程结束后（双方攻击都完成后）====================
        if (!result.isOver) {
            const afterAttackEndResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAfterAttackEnd(battle);
            BossSpecialRules_1.BossSpecialRules.SettleBossHp(battle, 'dot');
            utils_1.Logger.Debug(`[BattleTurnExecutor] 出手流程结束后效果: ${afterAttackEndResults.length}个结果`);
            if (battle.player.hp <= 0) {
                utils_1.Logger.Info(`[BattleTurnExecutor] 出手流程结束后效果导致${isPvp ? '玩家1' : '玩家'}精灵阵亡`);
            }
            else if (battle.enemy.hp <= 0) {
                battle.isOver = true;
                result.isOver = true;
                result.winner = battle.userId;
                result.reason = 0;
            }
        }
        // ==================== 回合结束效果 ====================
        if (!result.isOver) {
            const turnEndResults = BattleEffectIntegration_1.BattleEffectIntegration.OnTurnEnd(battle);
            BossSpecialRules_1.BossSpecialRules.OnTurnEnd(battle);
            SkillEffectRuntime_1.SkillEffectRuntime.TurnEnd(battle);
            BossSpecialRules_1.BossSpecialRules.SettleBossHp(battle, 'dot');
            utils_1.Logger.Debug(`[BattleTurnExecutor] 回合结束效果: ${turnEndResults.length}个结果`);
            if (battle.player.hp <= 0) {
                utils_1.Logger.Info(`[BattleTurnExecutor] 回合结束效果导致${isPvp ? '玩家1' : '玩家'}精灵阵亡`);
            }
            else if (battle.enemy.hp <= 0) {
                battle.isOver = true;
                result.isOver = true;
                result.winner = battle.userId;
                result.reason = 0;
            }
        }
        // 更新回合数（每个完整回合+1）
        if (battle.roundCount !== undefined) {
            battle.roundCount++;
        }
        return result;
    }
    /**
     * 放弃出手：本回合不行动，敌方获得先手权；控制类异常照常过一回合
     */
    static IdleCanAct(battle) {
        SkillEffectRuntime_1.SkillEffectRuntime.CanAct(battle, battle.player, this.GetNoActionSkill());
        BattleCore_1.BattleCore.CanAct(battle.player);
        return { canAct: false, reason: 'idle' };
    }
    /**
     * 执行单次攻击（9阶段出手流程）
     *
     * 阶段1: ATTACK_START — 出手流程开始（异常扣血）
     * 阶段2: 命中前 — BEFORE_SKILL / BEFORE_HIT_CHECK / CheckHit / AFTER_HIT_CHECK
     * 阶段3: ON_HIT — 命中时（需命中才触发）
     * 阶段4: SKILL_EFFECT — 即时技能效果结算
     * 阶段5: 造成伤害前 — 暴击判定 / BEFORE_DAMAGE_CALC / CalculateDamage / AFTER_DAMAGE_CALC / BEFORE_DAMAGE_APPLY
     * 阶段6: 伤害结算 — 实际扣血
     * 阶段7: 造成伤害后 — AFTER_DAMAGE_APPLY / ON_RECEIVE_DAMAGE / AFTER_SKILL
     * 阶段8: ATTACK_END — 出手流程结束时（击败判定）
     * 阶段9: AFTER_ATTACK_END — 在 ExecuteTurn 中处理（双方攻击完成后）
     */
    static ExecuteAttack(battle, attacker, defender, skill, attackerUserId, canAct, isFirst) {
        // 如果无法行动，返回空攻击
        if (!canAct.canAct) {
            utils_1.Logger.Info(`[攻击] ${attackerUserId === 0 ? '敌人' : '玩家'} 无法行动: ${canAct.reason}`);
            return {
                userId: attackerUserId,
                skillId: 0,
                atkTimes: 0,
                damage: 0,
                gainHp: 0,
                attackerRemainHp: attacker.hp,
                attackerMaxHp: attacker.maxHp,
                defenderRemainHp: defender.hp,
                defenderMaxHp: defender.maxHp,
                missed: false,
                blocked: false,
                isCrit: false,
                attackerStatus: attacker.statusArray || [],
                attackerBattleLv: attacker.battleLv || []
            };
        }
        BossSpecialRules_1.BossSpecialRules.SpendBossPP(battle, attacker, skill);
        // ==================== 阶段1: ATTACK_START — 出手流程开始 ====================
        const attackStartResult = BattleEffectIntegration_1.BattleEffectIntegration.OnAttackStart(attacker, defender, skill);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段1 出手流程开始: 异常扣血=${attackStartResult.statusDamage}, 效果=${attackStartResult.results.length}个`);
        // 检查连续攻击次数
        const multiHitCount = attacker.effectData?.multiHitCount || 1;
        utils_1.Logger.Debug(`[ExecuteAttack] 连续攻击次数: ${multiHitCount}`);
        // 异常致死检查 — defender 被异常扣血致死，提前返回
        if (defender.hp <= 0) {
            utils_1.Logger.Info(`[攻击] ${defender.name} 被异常状态致死`);
            return {
                userId: attackerUserId,
                skillId: skill.id,
                atkTimes: 0,
                damage: 0,
                gainHp: 0,
                attackerRemainHp: attacker.hp,
                attackerMaxHp: attacker.maxHp,
                defenderRemainHp: 0,
                defenderMaxHp: defender.maxHp,
                missed: false,
                blocked: false,
                isCrit: false,
                attackerStatus: attacker.statusArray || [],
                attackerBattleLv: attacker.battleLevels || attacker.battleLv || []
            };
        }
        // ==================== 阶段2: 命中前 ====================
        // 攻击时效果
        const attackResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAttack(attacker, defender, skill);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段2 攻击时效果: ${attackResults.length}个结果`);
        // 技能使用前效果 — "使用技能时"效果（命中前生效）
        const beforeSkillResults = BattleEffectIntegration_1.BattleEffectIntegration.OnBeforeSkill(attacker, defender, skill);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段2 技能使用前效果: ${beforeSkillResults.length}个结果`);
        // 命中判定前效果
        const beforeHitCheckResults = BattleEffectIntegration_1.BattleEffectIntegration.OnBeforeHitCheck(attacker, defender, skill);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段2 命中判定前效果: ${beforeHitCheckResults.length}个结果`);
        // 命中判定
        const hit = SkillEffectRuntime_1.SkillEffectRuntime.ResolveHit(battle, attacker, defender, skill, isFirst, () => BattleCore_1.BattleCore.CheckHit(attacker, defender, skill));
        // 命中判定后效果
        const afterHitCheckResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAfterHitCheck(attacker, defender, skill, hit);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段2 命中判定后效果: ${afterHitCheckResults.length}个结果`);
        // 未命中 → 闪避效果 → 跳到阶段8
        if (!hit) {
            utils_1.Logger.Info(`[攻击] 技能 ${skill.name} 未命中`);
            BossSpecialRules_1.BossSpecialRules.OnAttackMissed(defender, skill);
            SkillEffectRuntime_1.SkillEffectRuntime.OnMiss(battle, attacker, defender, skill);
            // 闪避效果
            const evadeResults = BattleEffectIntegration_1.BattleEffectIntegration.OnEvade(attacker, defender, skill);
            utils_1.Logger.Debug(`[ExecuteAttack] 阶段2 闪避效果: ${evadeResults.length}个结果`);
            // 未命中的技能不触发技能特效（落空类效果由技能效果运行时处理）
            // 阶段8: 出手流程结束时（即使未命中也触发）
            const attackEndResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAttackEnd(attacker, defender, skill, 0);
            utils_1.Logger.Debug(`[ExecuteAttack] 阶段8 出手流程结束时（未命中）: ${attackEndResults.length}个结果`);
            return {
                userId: attackerUserId,
                skillId: skill.id,
                atkTimes: 0,
                damage: 0,
                gainHp: 0,
                attackerRemainHp: attacker.hp,
                attackerMaxHp: attacker.maxHp,
                defenderRemainHp: defender.hp,
                defenderMaxHp: defender.maxHp,
                missed: true,
                blocked: false,
                isCrit: false,
                attackerStatus: attacker.statusArray || [],
                attackerBattleLv: attacker.battleLevels || attacker.battleLv || []
            };
        }
        // ==================== 阶段3: ON_HIT — 命中时 ====================
        const onHitResults = BattleEffectIntegration_1.BattleEffectIntegration.OnHit(attacker, defender, skill);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段3 命中时效果: ${onHitResults.length}个结果`);
        // 受到攻击时效果
        const attackedResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAttacked(attacker, defender, skill);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段3 受到攻击时效果: ${attackedResults.length}个结果`);
        // ==================== 阶段4: SKILL_EFFECT — 即时技能效果结算 ====================
        const skillEffectResults = BattleEffectIntegration_1.BattleEffectIntegration.OnSkillEffect(attacker, defender, skill);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段4 即时技能效果结算: ${skillEffectResults.length}个结果`);
        // 变化技能不进行暴击判定和伤害计算
        const isStatusMove = skill.category === 4; // SkillCategory.STATUS = 4
        let isCrit = false;
        let damage = 0;
        if (!isStatusMove) {
            // 暴击判定（阶段4的一部分，在技能效果结算后进行）
            // 暴击判定前效果
            const beforeCritCheckResults = BattleEffectIntegration_1.BattleEffectIntegration.OnBeforeCritCheck(attacker, defender, skill);
            utils_1.Logger.Debug(`[ExecuteAttack] 阶段4 暴击判定前效果: ${beforeCritCheckResults.length}个结果`);
            // 暴击判定
            isCrit = SkillEffectRuntime_1.SkillEffectRuntime.Crit(battle, attacker, defender, skill, () => BattleCore_1.BattleCore.CheckCrit(attacker, defender, skill, isFirst));
            // ==================== 阶段5: 造成伤害前 ====================
            // 伤害计算前效果 — "造成伤害前""命中后"效果
            const beforeCalcResults = BattleEffectIntegration_1.BattleEffectIntegration.OnBeforeDamageCalc(attacker, defender, skill);
            utils_1.Logger.Debug(`[ExecuteAttack] 阶段5 伤害计算前效果: ${beforeCalcResults.length}个结果`);
            // 检查秒杀效果（优先级最高，跳过所有后续伤害修正）
            const instantKillResult = beforeCalcResults.find(r => r.type === 'instant_kill' && r.success);
            if (instantKillResult && instantKillResult.value) {
                // 秒杀：直接设置伤害为对方当前 HP，跳过 AFTER_DAMAGE_CALC 和 BEFORE_DAMAGE_APPLY
                damage = instantKillResult.value;
                utils_1.Logger.Info(`[ExecuteAttack] 阶段5 秒杀生效: ${attacker.name} → ${defender.name}, damage=${damage}`);
                damage = BossSpecialRules_1.BossSpecialRules.ModifyDamageToBoss(battle, attacker, defender, skill, SkillEffectRuntime_1.SkillEffectRuntime.Damage(battle, attacker, defender, skill, damage, 'ohko', isFirst), 'ohko');
            }
            else {
                // 检查是否有固定伤害效果
                const fixedDamageResult = beforeCalcResults.find(r => r.type === 'fixed_damage' && r.success);
                if (fixedDamageResult && fixedDamageResult.value) {
                    // 如果有固定伤害效果，使用固定伤害值
                    damage = fixedDamageResult.value;
                    utils_1.Logger.Debug(`[ExecuteAttack] 阶段5 使用固定伤害: ${damage}`);
                    if (fixedDamageResult.data?.mode === 'percent' && skill.power > 0)
                        damage += BattleCore_1.BattleCore.CalculateDamage(attacker, defender, skill, isCrit, skill.power).damage;
                    damage = BossSpecialRules_1.BossSpecialRules.ModifyDamageToBoss(battle, attacker, defender, skill, SkillEffectRuntime_1.SkillEffectRuntime.Damage(battle, attacker, defender, skill, damage, 'fixed', isFirst), 'fixed', { mode: fixedDamageResult.data?.mode });
                }
                else {
                    // 检查烧伤状态：攻击威力降低50%
                    let skillPower = skill.power || 40;
                    const powerResult = beforeCalcResults.filter(r => r.success && r.type === 'power_modifier').pop();
                    if (typeof powerResult?.value === 'number')
                        skillPower = powerResult.value;
                    skillPower = SkillEffectRuntime_1.SkillEffectRuntime.Power(attacker, defender, skill, skillPower);
                    const statusDurations = attacker.statusDurations || [];
                    if (statusDurations[BattleCore_1.BattleStatusType.BURN] > 0) {
                        skillPower = Math.floor(skillPower * 0.5);
                        utils_1.Logger.Debug(`[ExecuteAttack] 烧伤状态：威力降低50%, ${skill.power} -> ${skillPower}`);
                    }
                    // 检查衰弱状态：伤害随层级提升（25%|50%|100%|250%|500%）
                    let weakenMultiplier = 1.0;
                    const defenderStatusDurations = defender.statusDurations || [];
                    if (defenderStatusDurations[BattleCore_1.BattleStatusType.WEAKNESS] > 0) {
                        const weaknessLevel = defenderStatusDurations[BattleCore_1.BattleStatusType.WEAKNESS];
                        const weakenRates = [1.25, 1.5, 2.0, 3.5, 6.0];
                        weakenMultiplier = weakenRates[Math.min(weaknessLevel - 1, 4)] || 1.0;
                        utils_1.Logger.Debug(`[ExecuteAttack] 衰弱状态：伤害提升${(weakenMultiplier - 1) * 100}%, 倍率=${weakenMultiplier}`);
                    }
                    // 伤害计算
                    const damageResult = BattleCore_1.BattleCore.CalculateDamage(attacker, defender, skill, isCrit, skillPower);
                    damage = Math.floor(damageResult.damage * weakenMultiplier);
                    utils_1.Logger.Debug(`[ExecuteAttack] 属性克制: 攻击方type=${attacker.type}, 防御方type=${defender.type}, 克制倍率=${damageResult.effectiveness}`);
                    // 伤害计算后效果（伤害上限/下限）
                    const afterCalcResult = BattleEffectIntegration_1.BattleEffectIntegration.OnAfterDamageCalc(attacker, defender, skill, damage);
                    damage = afterCalcResult.damage;
                    utils_1.Logger.Debug(`[ExecuteAttack] 阶段5 伤害计算后: ${damage} (原始: ${damageResult.damage})`);
                    // BOSS规则（顺序破防、破防/击杀条件、封印、减伤等）
                    damage = BossSpecialRules_1.BossSpecialRules.ModifyDamageToBoss(battle, attacker, defender, skill, SkillEffectRuntime_1.SkillEffectRuntime.Damage(battle, attacker, defender, skill, damage, 'attack', isFirst), 'attack', { effectiveness: damageResult.effectiveness });
                }
                // 伤害应用前效果（伤害减免）
                const beforeApplyResult = BattleEffectIntegration_1.BattleEffectIntegration.OnBeforeDamageApply(attacker, defender, skill, damage);
                damage = beforeApplyResult.damage;
                utils_1.Logger.Debug(`[ExecuteAttack] 阶段5 伤害应用前: ${damage}`);
            }
        }
        else {
            utils_1.Logger.Debug(`[ExecuteAttack] 变化技能，跳过暴击判定和伤害计算`);
        }
        // ==================== 阶段6: 伤害结算 ====================
        const actualDamage = damage;
        const oldDefenderHP = defender.hp;
        defender.hp = Math.max(0, defender.hp - actualDamage);
        BossSpecialRules_1.BossSpecialRules.AfterBossDamaged(battle, attacker, defender, skill, actualDamage);
        SkillEffectRuntime_1.SkillEffectRuntime.AfterAttack(battle, attacker, defender, skill, actualDamage, isFirst);
        (0, PuniSealBattle_1.ResolvePuniSurvival)(battle, defender);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段6 伤害结算: 伤害=${actualDamage}, ` +
            `防御方HP: ${oldDefenderHP} -> ${defender.hp} (最大${defender.maxHp})`);
        // HP变化时效果
        if (oldDefenderHP !== defender.hp) {
            const hpChangeResults = BattleEffectIntegration_1.BattleEffectIntegration.OnHPChange(defender, attacker, oldDefenderHP, defender.hp);
            utils_1.Logger.Debug(`[ExecuteAttack] 阶段6 HP变化效果: ${hpChangeResults.length}个结果`);
        }
        utils_1.Logger.Info(`[攻击] ${attackerUserId === 0 ? '敌人' : '玩家'} 使用 ${skill.name}, ` +
            `造成 ${actualDamage} 点伤害${isCrit ? ' (暴击!)' : ''}, ` +
            `对方剩余HP: ${defender.hp}/${defender.maxHp}`);
        // ==================== 阶段7: 造成伤害后 ====================
        // 伤害应用后效果（吸血、反伤等）
        const afterApplyResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAfterDamageApply(attacker, defender, skill, actualDamage);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段7 伤害应用后效果: ${afterApplyResults.length}个结果`);
        // 寄生状态：对手恢复等量体力
        const defenderStatusDurations = defender.statusDurations || [];
        if (defenderStatusDurations[BattleCore_1.BattleStatusType.DRAIN] > 0) {
            const healAmount = Math.min(actualDamage, attacker.maxHp - attacker.hp);
            if (healAmount > 0) {
                attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
                utils_1.Logger.Info(`[ExecuteAttack] 寄生状态：攻击方恢复${healAmount}点体力`);
            }
        }
        // 受到伤害时效果
        const receiveDamageResults = BattleEffectIntegration_1.BattleEffectIntegration.OnReceiveDamage(attacker, defender, skill, actualDamage);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段7 受到伤害效果: ${receiveDamageResults.length}个结果`);
        // 技能使用后效果（能力变化、状态施加等）— "使用技能后"效果
        const afterSkillResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAfterSkill(attacker, defender, skill, actualDamage);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段7 技能使用后效果: ${afterSkillResults.length}个结果`);
        // ==================== 阶段8: ATTACK_END — 出手流程结束时 ====================
        const attackEndResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAttackEnd(attacker, defender, skill, actualDamage);
        utils_1.Logger.Debug(`[ExecuteAttack] 阶段8 出手流程结束时效果: ${attackEndResults.length}个结果`);
        // 击败效果
        if (defender.hp <= 0) {
            const koResults = BattleEffectIntegration_1.BattleEffectIntegration.OnKO(attacker, defender, skill);
            utils_1.Logger.Debug(`[ExecuteAttack] 阶段8 击败效果: ${koResults.length}个结果`);
            // 击败对方后效果
            const afterKoResults = BattleEffectIntegration_1.BattleEffectIntegration.OnAfterKO(attacker, defender, skill);
            utils_1.Logger.Debug(`[ExecuteAttack] 阶段8 击败对方后效果: ${afterKoResults.length}个结果`);
            // 记录最后一击是否暴击（用于周几规则验证）
            if (battle.lastHitWasCritical !== undefined) {
                battle.lastHitWasCritical = isCrit;
                utils_1.Logger.Debug(`[ExecuteAttack] 记录最后一击暴击状态: ${isCrit}`);
            }
        }
        // ==================== 统计效果结果（吸血等）====================
        let gainHp = 0;
        const allResults = [
            ...afterApplyResults,
            ...receiveDamageResults,
            ...afterSkillResults,
            ...attackEndResults
        ];
        for (const result of allResults) {
            if (result.success && (result.type === 'absorb' || result.type === 'heal' || result.type === 'damage_lifesteal') && result.value) {
                gainHp += result.value;
            }
        }
        // ==================== 返回攻击结果 ====================
        const result = {
            userId: attackerUserId,
            skillId: skill.id,
            atkTimes: SkillEffectRuntime_1.SkillEffectRuntime.AtkTimes(attacker, multiHitCount),
            damage: actualDamage,
            gainHp,
            attackerRemainHp: attacker.hp,
            attackerMaxHp: attacker.maxHp,
            defenderRemainHp: defender.hp,
            defenderMaxHp: defender.maxHp,
            missed: false,
            blocked: false,
            isCrit,
            attackerStatus: attacker.statusArray || [],
            attackerBattleLv: attacker.battleLevels || attacker.battleLv || []
        };
        utils_1.Logger.Debug(`[ExecuteAttack] 返回结果: damage=${result.damage}, ` +
            `defenderRemainHp=${result.defenderRemainHp}/${result.defenderMaxHp}`);
        return result;
    }
    /**
     * 获取无动作技能（换精灵时使用，不产生攻击）
     */
    static GetNoActionSkill() {
        return {
            id: 0,
            name: '换精灵',
            category: 4, // STATUS，不造成伤害
            type: 8,
            power: 0,
            maxPP: 99,
            accuracy: 0,
            critRate: 0,
            priority: 0,
            mustHit: false
        };
    }
    /**
     * 获取默认技能（撞击）
     */
    static GetDefaultSkill() {
        return {
            id: 10001,
            name: '撞击',
            category: 1,
            type: 8,
            power: 40,
            maxPP: 35,
            accuracy: 100,
            critRate: 1,
            priority: 0,
            mustHit: false
        };
    }
    /**
     * 处理回合开始时的效果
     * 包括：克制效果、愤怒效果等需要在回合开始检查的效果
     */
    static ProcessTurnStartEffects(battle, playerSkill, enemySkill) {
        // 1. 检查玩家是否被克制（必须使用上次技能）
        if (battle.player.encore && battle.player.encoreTurns && battle.player.encoreTurns > 0) {
            battle.player.encoreTurns--;
            if (battle.player.encoreTurns <= 0) {
                battle.player.encore = false;
            }
            utils_1.Logger.Info(`[回合开始] 玩家被克制，必须使用上次技能 (剩余${battle.player.encoreTurns}回合)`);
        }
        // 2. 检查敌人是否被克制
        if (battle.enemy.encore && battle.enemy.encoreTurns && battle.enemy.encoreTurns > 0) {
            battle.enemy.encoreTurns--;
            if (battle.enemy.encoreTurns <= 0) {
                battle.enemy.encore = false;
            }
            utils_1.Logger.Info(`[回合开始] 敌人被克制，必须使用上次技能 (剩余${battle.enemy.encoreTurns}回合)`);
        }
        // 3. 触发回合开始时机的效果
        const playerTurnStartEffects = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(playerSkill, battle.player, battle.enemy, 0, EffectContext_1.EffectTiming.TURN_START);
        const enemyTurnStartEffects = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(enemySkill, battle.enemy, battle.player, 0, EffectContext_1.EffectTiming.TURN_START);
        // 应用效果
        if (playerTurnStartEffects.length > 0) {
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(playerTurnStartEffects, battle.player, battle.enemy);
        }
        if (enemyTurnStartEffects.length > 0) {
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(enemyTurnStartEffects, battle.enemy, battle.player);
        }
    }
    /**
     * 处理回合结束时的效果
     * 包括：持续伤害、状态恢复等
     */
    static ProcessTurnEndEffects(battle, playerSkill, enemySkill) {
        // 1. 触发回合结束时机的效果
        const playerTurnEndEffects = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(playerSkill, battle.player, battle.enemy, 0, EffectContext_1.EffectTiming.TURN_END);
        const enemyTurnEndEffects = EffectTrigger_1.EffectTrigger.TriggerSkillEffect(enemySkill, battle.enemy, battle.player, 0, EffectContext_1.EffectTiming.TURN_END);
        // 应用效果
        if (playerTurnEndEffects.length > 0) {
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(playerTurnEndEffects, battle.player, battle.enemy);
        }
        if (enemyTurnEndEffects.length > 0) {
            EffectTrigger_1.EffectTrigger.ApplyEffectResults(enemyTurnEndEffects, battle.enemy, battle.player);
        }
        (0, PuniSealBattle_1.HealPuniLifeSeal)(battle);
        utils_1.Logger.Debug(`[回合结束] 回合 ${battle.turn} 结束效果处理完成`);
    }
}
exports.BattleTurnExecutor = BattleTurnExecutor;
//# sourceMappingURL=BattleTurnExecutor.js.map