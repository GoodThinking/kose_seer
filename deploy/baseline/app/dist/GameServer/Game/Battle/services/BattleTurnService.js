"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleTurnService = void 0;
const utils_1 = require("../../../../shared/utils");
const BattleTurnExecutor_1 = require("../BattleTurnExecutor");
const BattleCaptureSystem_1 = require("../BattleCaptureSystem");
const BattleEscapeSystem_1 = require("../BattleEscapeSystem");
const BattleCore_1 = require("../BattleCore");
const GameConfig_1 = require("../../../../shared/config/game/GameConfig");
/**
 * 战斗回合服务
 * 负责处理战斗回合逻辑、伤害计算、技能效果、捕获、逃跑等
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua
 */
class BattleTurnService {
    // 逃跑尝试次数记录（按战斗ID存储）
    escapeAttempts = new Map();
    /**
     * 执行一个战斗回合（统一 PvE/PvP）
     *
     * @param battle 战斗实例
     * @param pet1SkillId 玩家/玩家1选择的技能ID
     * @param pet2SkillId PvP时玩家2的技能ID；undefined表示PvE模式（AI选技能）
     * @returns 回合结果
     */
    ExecuteTurn(battle, pet1SkillId, pet2SkillId) {
        // 增加回合数
        battle.turn++;
        const isPvp = pet2SkillId !== undefined;
        // 加载所有技能配置
        const skillConfigs = new Map();
        for (const skillId of battle.player.skills) {
            this.LoadSkillConfig(skillId, skillConfigs);
        }
        for (const skillId of battle.enemy.skills) {
            this.LoadSkillConfig(skillId, skillConfigs);
        }
        // 确保玩家选的技能也被加载
        if (pet1SkillId > 0)
            this.LoadSkillConfig(pet1SkillId, skillConfigs);
        if (isPvp) {
            // PvP: 确保玩家2选的技能也被加载
            if (pet2SkillId > 0)
                this.LoadSkillConfig(pet2SkillId, skillConfigs);
            return BattleTurnExecutor_1.BattleTurnExecutor.ExecuteTurn(battle, pet1SkillId, pet2SkillId, skillConfigs, { isPvp: true, pet2UserId: battle.player2Id || 0 });
        }
        else {
            // PvE: AI选择敌方技能
            const enemySkillId = require("../UniverseBossBudget").selectSkill(battle, require("../UniverseBossRules").selectLegalSkill(battle, battle.starArena ? require("../StarArena").StarArena.SelectSkill(battle, skillConfigs) : require("../BossSpecialRules").BossSpecialRules.SelectBossSkill(battle, BattleCore_1.BattleCore.AISelectSkill(battle.enemy, battle.player, battle.enemy.skills, skillConfigs)), skillConfigs), skillConfigs);
            this.LoadSkillConfig(enemySkillId, skillConfigs);
            return BattleTurnExecutor_1.BattleTurnExecutor.ExecuteTurn(battle, pet1SkillId, enemySkillId, skillConfigs, { playerIdle: pet1SkillId === 0 });
        }
    }
    /**
     * 执行敌人回合（玩家使用道具/捕捉失败后，只有敌人攻击）
     * 用于捕捉失败、使用道具等场景
     */
    ExecuteEnemyTurn(battle) {
        // 玩家放弃出手：敌方获得先手权，回合开始和结束的效果照常结算
        battle.turn++;
        const skillConfigs = new Map();
        for (const skillId of battle.player.skills) {
            this.LoadSkillConfig(skillId, skillConfigs);
        }
        for (const skillId of battle.enemy.skills) {
            this.LoadSkillConfig(skillId, skillConfigs);
        }
        const enemySkillId = require("../UniverseBossBudget").selectSkill(battle, require("../UniverseBossRules").selectLegalSkill(battle, battle.starArena ? require("../StarArena").StarArena.SelectSkill(battle, skillConfigs) : require("../BossSpecialRules").BossSpecialRules.SelectBossSkill(battle, BattleCore_1.BattleCore.AISelectSkill(battle.enemy, battle.player, battle.enemy.skills, skillConfigs)), skillConfigs), skillConfigs);
        this.LoadSkillConfig(enemySkillId, skillConfigs);
        const result = BattleTurnExecutor_1.BattleTurnExecutor.ExecuteTurn(battle, 0, enemySkillId, skillConfigs, { playerIdle: true });
        const enemyAttack = [result.firstAttack, result.secondAttack].find(attack => attack && attack.userId !== battle.userId);
        // 回合开始时已分出胜负，敌方没有出手
        return enemyAttack || BattleTurnExecutor_1.BattleTurnExecutor.ExecuteAttack(battle, battle.enemy, battle.player, BattleTurnExecutor_1.BattleTurnExecutor.GetNoActionSkill(), 0, { canAct: false, reason: 'idle' }, false);
    }
    /**
     * 加载技能配置到Map中
     */
    LoadSkillConfig(skillId, skillConfigs) {
        if (skillConfigs.has(skillId))
            return;
        const skillMove = GameConfig_1.GameConfig.GetSkillById(skillId);
        if (skillMove) {
            skillConfigs.set(skillId, {
                id: skillMove.ID,
                name: skillMove.Name,
                category: skillMove.Category,
                type: skillMove.Type,
                power: skillMove.Power,
                maxPP: skillMove.MaxPP,
                accuracy: skillMove.Accuracy,
                critRate: skillMove.CritRate || 1,
                priority: skillMove.Priority || 0,
                mustHit: skillMove.MustHit === 1,
                sideEffect: skillMove.SideEffect,
                sideEffectArg: skillMove.SideEffectArg
            });
        }
    }
    /**
     * 处理逃跑
     *
     * 逃跑成功率计算：
     * - 基于玩家和敌人的速度差
     * - 每次失败后成功率提升
     * - BOSS战斗无法逃跑
     * - 被束缚状态无法逃跑
     */
    Escape(battle) {
        const battleId = battle.startTime; // 使用开始时间作为战斗ID
        const attempts = this.escapeAttempts.get(battleId) || 0;
        // 检查是否可以逃跑
        const canEscape = BattleEscapeSystem_1.BattleEscapeSystem.CanEscape(battle, attempts);
        if (!canEscape.canEscape) {
            utils_1.Logger.Warn(`[BattleTurnService] 无法逃跑: ${canEscape.reason}`);
            return false;
        }
        // 尝试逃跑
        const result = BattleEscapeSystem_1.BattleEscapeSystem.AttemptEscape(battle, attempts);
        // 更新尝试次数
        this.escapeAttempts.set(battleId, result.attempts);
        if (result.success) {
            battle.isOver = true;
            utils_1.Logger.Info(`[BattleTurnService] 逃跑成功: 成功率=${result.escapeRate.toFixed(2)}%, 尝试次数=${result.attempts}`);
            // 清理尝试次数记录
            this.escapeAttempts.delete(battleId);
        }
        else {
            utils_1.Logger.Info(`[BattleTurnService] 逃跑失败: 成功率=${result.escapeRate.toFixed(2)}%, 尝试次数=${result.attempts}`);
        }
        return result.success;
    }
    /**
     * 尝试捕获精灵
     * @param battle 战斗信息
     * @param capsuleID 当前 KOSE 支持的胶囊物品ID 300001..300005
     */
    Catch(battle, capsuleID = 300001) {
        // 胶囊ID转精灵球类型
        const ballType = this.GetPokeBallType(capsuleID);
        if (ballType === undefined) {
            return { success: false, catchTime: 0, catchRate: 0, shakeCount: 0 };
        }
        const canCapture = BattleCaptureSystem_1.BattleCaptureSystem.CanCapture(battle.enemy, BattleCaptureSystem_1.BattleCaptureSystem.BossBlocksCapture(battle));
        if (!canCapture.canCapture) {
            utils_1.Logger.Warn(`[BattleTurnService] 无法捕获: ${canCapture.reason}`);
            return {
                success: false,
                catchTime: 0,
                catchRate: 0,
                shakeCount: 0
            };
        }
        // 计算基础捕获率（叠加图鉴里程碑光环加成）
        const baseCatchRate = Math.min(100, Math.round(50 * (1 + Number(battle.dexCatchBonus || 0))));
        // 尝试捕获
        const result = BattleCaptureSystem_1.BattleCaptureSystem.AttemptCapture(battle.enemy, ballType, baseCatchRate);
        if (result.success) {
            utils_1.Logger.Info(`[BattleTurnService] 捕获成功: Boss=${battle.enemy.id}, ` +
                `捕获率=${result.catchRate.toFixed(2)}%, ` +
                `摇晃次数=${result.shakeCount}, ` +
                `暴击捕获=${result.isCriticalCapture}`);
        }
        else {
            utils_1.Logger.Info(`[BattleTurnService] 捕获失败: ` +
                `捕获率=${result.catchRate.toFixed(2)}%, ` +
                `摇晃次数=${result.shakeCount}`);
        }
        return {
            success: result.success,
            catchTime: result.catchTime,
            catchRate: result.catchRate,
            shakeCount: result.shakeCount
        };
    }
    /**
     * 获取逃跑建议
     * 返回当前是否适合逃跑
     */
    GetEscapeAdvice(battle) {
        return BattleEscapeSystem_1.BattleEscapeSystem.IsGoodTimeToEscape(battle);
    }
    /**
     * 获取推荐精灵球
     * 根据目标状态推荐最合适的精灵球
     */
    GetRecommendedBall(battle) {
        const baseCatchRate = 50; // 可以从配置中获取
        return BattleCaptureSystem_1.BattleCaptureSystem.RecommendBall(battle.enemy, baseCatchRate);
    }
    /**
     * 清理战斗数据
     * 战斗结束后清理临时数据
     */
    CleanupBattle(battleId) {
        this.escapeAttempts.delete(battleId);
    }
    /**
     * 将胶囊物品ID转换为精灵球类型
     * 保留 KOSE 对 300001..300005 的倍率规则；其他胶囊尚未适配。
     * 300005 的必中规则是 KOSE 策略，不能由客户端资源证明为 XIN 算法。
     */
    GetPokeBallType(capsuleID) {
        switch (capsuleID) {
            case 300001:
                return BattleCaptureSystem_1.PokeBallType.NORMAL;
            case 300002:
                return BattleCaptureSystem_1.PokeBallType.INTERMEDIATE;
            case 300003:
                return BattleCaptureSystem_1.PokeBallType.ADVANCED;
            case 300004:
                return BattleCaptureSystem_1.PokeBallType.SUPER;
            case 300005:
            case 300006:
            case 300007:
            case 300010:
            case 300658:
            case 300726:
                return BattleCaptureSystem_1.PokeBallType.MASTER;
            default:
                return undefined;
        }
    }
}
exports.BattleTurnService = BattleTurnService;
//# sourceMappingURL=BattleTurnService.js.map