/**
 * 战斗AI系统
 * 负责敌人的技能选择策略
 * 
 * AI策略：
 * 1. 优先级系统：生存 > 控制 > 增益 > 攻击 > 削弱
 * 2. 情境判断：根据双方HP、状态、能力等级、PP等选择最佳策略
 * 3. 随机性：避免AI过于机械，增加战斗趣味性
 * 4. 连招系统：某些技能组合有额外加成
 */

import { IBattlePet } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { BattleAlgorithm } from './BattleAlgorithm';
import { Logger } from '../../../shared/utils';

/**
 * 技能评分结果
 */
interface ISkillScore {
  skillId: number;
  skill: ISkillConfig;
  score: number;
  reason: string;
}

/**
 * 战斗情境分析
 */
interface IBattleContext {
  aiHpRatio: number;
  playerHpRatio: number;
  aiHasBuffs: boolean;
  aiHasDebuffs: boolean;
  playerHasBuffs: boolean;
  playerHasDebuffs: boolean;
  aiHasStatus: boolean;
  playerHasStatus: boolean;
  isEarlyGame: boolean;  // 开局阶段
  isMidGame: boolean;    // 中期阶段
  isEndGame: boolean;    // 收尾阶段
}

/**
 * 战斗AI系统
 */
export class BattleAI {
  // 上一回合使用的技能（用于连招判断）
  private static lastSkillUsed: number = 0;

  /**
   * AI选择技能
   */
  public static SelectSkill(
    aiPet: IBattlePet,
    playerPet: IBattlePet,
    skills: number[],
    skillConfigs: Map<number, ISkillConfig>
  ): number {
    if (!skills || skills.length === 0) {
      return 10001;
    }

    // 分析战斗情境
    const context = this.AnalyzeBattleContext(aiPet, playerPet);

    // 收集所有技能的评分
    const skillScores: ISkillScore[] = [];

    for (const skillId of skills) {
      if (skillId <= 0) continue;

      const skill = skillConfigs.get(skillId);
      if (!skill) continue;

      // 检查PP是否足够
      if (!this.HasEnoughPP(aiPet, skillId)) {
        continue;
      }

      const evaluation = this.EvaluateSkill(aiPet, playerPet, skill, context);
      skillScores.push({
        skillId,
        skill,
        score: evaluation.score,
        reason: evaluation.reason
      });
    }

    if (skillScores.length === 0) {
      // 没有可用技能，使用第一个技能
      for (const skillId of skills) {
        if (skillId > 0) {
          this.lastSkillUsed = skillId;
          return skillId;
        }
      }
      return 10001;
    }

    // 按评分排序
    skillScores.sort((a, b) => b.score - a.score);

    // 记录AI决策
    const selected = skillScores[0];
    Logger.Debug(
      `[BattleAI] 选择技能: ${selected.skill.name} ` +
      `(评分=${selected.score.toFixed(1)}, 原因=${selected.reason})`
    );

    this.lastSkillUsed = selected.skillId;
    return selected.skillId;
  }

  /**
   * 分析战斗情境
   */
  private static AnalyzeBattleContext(
    aiPet: IBattlePet,
    playerPet: IBattlePet
  ): IBattleContext {
    const aiHpRatio = aiPet.hp / aiPet.maxHp;
    const playerHpRatio = playerPet.hp / playerPet.maxHp;

    return {
      aiHpRatio,
      playerHpRatio,
      aiHasBuffs: this.HasPositiveBuffs(aiPet),
      aiHasDebuffs: this.HasNegativeBuffs(aiPet),
      playerHasBuffs: this.HasPositiveBuffs(playerPet),
      playerHasDebuffs: this.HasNegativeBuffs(playerPet),
      aiHasStatus: aiPet.status !== undefined && aiPet.status > 0,
      playerHasStatus: playerPet.status !== undefined && playerPet.status > 0,
      isEarlyGame: aiHpRatio > 0.7 && playerHpRatio > 0.7,
      isMidGame: aiHpRatio > 0.3 && playerHpRatio > 0.3,
      isEndGame: aiHpRatio < 0.3 || playerHpRatio < 0.3
    };
  }

  /**
   * 评估技能得分
   */
  private static EvaluateSkill(
    aiPet: IBattlePet,
    playerPet: IBattlePet,
    skill: ISkillConfig,
    context: IBattleContext
  ): { score: number; reason: string } {
    // 判断技能类型
    const isAttackSkill = skill.power && skill.power > 0;
    const isHealSkill = skill.sideEffect === 1;
    const isBuffSkill = this.IsBuffSkill(skill);
    const isDebuffSkill = this.IsDebuffSkill(skill);
    const isStatusSkill = this.IsStatusSkill(skill);
    const isControlSkill = this.IsControlSkill(skill);

    let score = 0;
    let reason = '';

    // ==================== 1. 紧急生存策略 ====================
    if (context.aiHpRatio < 0.25) {
      if (isHealSkill) {
        score = 250;
        reason = '危急生存-回复技能';
        return { score: this.AddRandomness(score, 0.1), reason };
      }
      
      // HP极低时，优先使用高威力技能尝试击杀对手
      if (isAttackSkill && skill.power! >= 80) {
        score = 200;
        reason = '背水一战-高威力攻击';
        return { score: this.AddRandomness(score, 0.15), reason };
      }
    }

    // ==================== 2. 控制策略 ====================
    // 控制技能（睡眠、冰冻、混乱等）优先级很高
    if (isControlSkill && !context.playerHasStatus) {
      score = 180;
      reason = '控制对手-限制行动';
      return { score: this.AddRandomness(score, 0.12), reason };
    }

    // ==================== 3. 开局增益策略 ====================
    if (context.isEarlyGame && isBuffSkill && !context.aiHasBuffs) {
      score = 160;
      reason = '开局强化-提升能力';
      return { score: this.AddRandomness(score, 0.15), reason };
    }

    // ==================== 4. 削弱强敌策略 ====================
    if (context.playerHpRatio > 0.6 && isDebuffSkill && !context.playerHasDebuffs) {
      score = 140;
      reason = '削弱强敌-降低威胁';
      return { score: this.AddRandomness(score, 0.15), reason };
    }

    // ==================== 5. 状态异常策略 ====================
    if (isStatusSkill && !context.playerHasStatus) {
      // 根据对手HP决定优先级
      if (context.playerHpRatio > 0.7) {
        score = 130;
        reason = '施加异常-持续消耗';
      } else {
        score = 80;
        reason = '施加异常-辅助输出';
      }
      return { score: this.AddRandomness(score, 0.15), reason };
    }

    // ==================== 6. 回复策略 ====================
    if (context.aiHpRatio < 0.5 && isHealSkill) {
      score = 120;
      reason = '中度回复-恢复状态';
      return { score: this.AddRandomness(score, 0.15), reason };
    }

    // ==================== 7. 攻击策略 ====================
    if (isAttackSkill) {
      // 基础评分：威力
      score = skill.power || 0;

      // 属性克制加成
      const typeMod = BattleAlgorithm.GetTypeEffectiveness(skill.type || 8, playerPet.type);
      score = score * typeMod;

      // 命中率修正
      const accuracy = skill.accuracy || 100;
      score = score * (accuracy / 100);

      // 优先级修正（先制技能）
      if (skill.priority && skill.priority > 0) {
        score = score * 1.3;
        reason = '先制技能';
      }

      // 必中技能加成
      if (skill.mustHit) {
        score = score * 1.2;
        reason = '必中技能';
      }

      // 收尾阶段策略
      if (context.isEndGame) {
        if (context.playerHpRatio < 0.3) {
          score = score * 2.0;
          reason = '收割击杀';
        } else if (context.aiHpRatio < 0.3) {
          score = score * 1.5;
          reason = '拼死一搏';
        }
      }

      // 中期持续输出
      if (context.isMidGame) {
        if (context.playerHpRatio < 0.6) {
          score = score * 1.4;
          reason = '压制输出';
        } else {
          reason = '稳定输出';
        }
      }

      // 属性克制说明
      if (typeMod >= 2.0) {
        reason += '-效果拔群';
        score = score * 1.2; // 额外加成
      } else if (typeMod <= 0.5) {
        reason += '-效果不佳';
        score = score * 0.6; // 降低优先级
      }

      // 连招加成
      if (this.IsComboSkill(this.lastSkillUsed, skill.id)) {
        score = score * 1.3;
        reason += '-连招';
      }

      // 对手有增益时，优先使用高威力技能
      if (context.playerHasBuffs && skill.power! >= 70) {
        score = score * 1.3;
        reason += '-破防';
      }

      return { score: this.AddRandomness(score, 0.15), reason };
    }

    // ==================== 8. 已有增益/削弱时降低优先级 ====================
    if (isBuffSkill && context.aiHasBuffs) {
      score = 40;
      reason = '已有增益-低优先级';
    }

    if (isDebuffSkill && context.playerHasDebuffs) {
      score = 35;
      reason = '已有削弱-低优先级';
    }

    // ==================== 9. 默认评分 ====================
    if (score === 0) {
      score = 30;
      reason = '变化技能-默认';
    }

    return { score: this.AddRandomness(score, 0.2), reason };
  }

  /**
   * 检查是否有足够的PP
   */
  private static HasEnoughPP(pet: IBattlePet, skillId: number): boolean {
    if (!pet.skills || !pet.skillPP) return true;

    const skillIndex = pet.skills.indexOf(skillId);
    if (skillIndex === -1) return true;

    const pp = pet.skillPP[skillIndex];
    return pp > 0;
  }

  /**
   * 判断是否是控制技能（睡眠、冰冻、混乱等强控制）
   */
  private static IsControlSkill(skill: ISkillConfig): boolean {
    if (!skill.sideEffectArg) return false;

    const controlEffects = ['sleep', 'freeze', 'confusion', 'flinch'];
    const argStr = String(skill.sideEffectArg).toLowerCase();
    return controlEffects.some(effect => argStr.includes(effect));
  }

  /**
   * 判断是否是增益技能
   */
  private static IsBuffSkill(skill: ISkillConfig): boolean {
    if (!skill.sideEffectArg) return false;

    const buffEffects = [
      'attack_boost', 'defense_boost', 'sp_attack_boost',
      'sp_defense_boost', 'speed_boost', 'accuracy_boost',
      'evasion_boost', 'all_stats_boost', 'crit_boost'
    ];

    const argStr = String(skill.sideEffectArg).toLowerCase();
    return buffEffects.some(effect => argStr.includes(effect));
  }

  /**
   * 判断是否是削弱技能
   */
  private static IsDebuffSkill(skill: ISkillConfig): boolean {
    if (!skill.sideEffectArg) return false;

    const debuffEffects = [
      'attack_down', 'defense_down', 'sp_attack_down',
      'sp_defense_down', 'speed_down', 'accuracy_down', 'evasion_down'
    ];

    const argStr = String(skill.sideEffectArg).toLowerCase();
    return debuffEffects.some(effect => argStr.includes(effect));
  }

  /**
   * 判断是否是异常状态技能
   */
  private static IsStatusSkill(skill: ISkillConfig): boolean {
    if (!skill.sideEffectArg) return false;

    const statusEffects = ['poison', 'burn', 'paralyze'];
    const argStr = String(skill.sideEffectArg).toLowerCase();
    return statusEffects.some(effect => argStr.includes(effect));
  }

  /**
   * 检查精灵是否有正面增益
   */
  private static HasPositiveBuffs(pet: IBattlePet): boolean {
    if (!pet.battleLevels) return false;
    return pet.battleLevels.some(level => level > 0);
  }

  /**
   * 检查精灵是否有负面削弱
   */
  private static HasNegativeBuffs(pet: IBattlePet): boolean {
    if (!pet.battleLevels) return false;
    return pet.battleLevels.some(level => level < 0);
  }

  /**
   * 判断是否是连招技能
   * 某些技能组合使用有额外效果
   */
  private static IsComboSkill(lastSkill: number, currentSkill: number): boolean {
    // 连招组合表（可以根据实际游戏扩展）
    const combos: { [key: number]: number[] } = {
      // 示例：技能A -> 技能B/C/D 形成连招
      // 10001: [10002, 10003],
    };

    if (!combos[lastSkill]) return false;
    return combos[lastSkill].includes(currentSkill);
  }

  /**
   * 添加随机性
   * @param score 原始评分
   * @param variance 波动幅度 (0-1)
   * @returns 添加随机波动后的评分
   */
  private static AddRandomness(score: number, variance: number = 0.15): number {
    const min = 1 - variance;
    const max = 1 + variance;
    const randomFactor = min + Math.random() * (max - min);
    return score * randomFactor;
  }

  /**
   * 获取AI难度系数
   * 可以根据敌人等级或类型调整AI智能程度
   */
  public static GetDifficultyFactor(level: number): number {
    if (level < 10) return 0.7;
    if (level < 30) return 1.0;
    if (level < 50) return 1.2;
    return 1.5;
  }

  /**
   * 重置AI状态（新战斗开始时调用）
   */
  public static Reset(): void {
    this.lastSkillUsed = 0;
  }
}
