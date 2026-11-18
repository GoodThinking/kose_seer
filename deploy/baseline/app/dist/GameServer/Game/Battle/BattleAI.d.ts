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
/**
 * 战斗AI系统
 */
export declare class BattleAI {
    private static lastSkillUsed;
    /**
     * AI选择技能
     */
    static SelectSkill(aiPet: IBattlePet, playerPet: IBattlePet, skills: number[], skillConfigs: Map<number, ISkillConfig>): number;
    /**
     * 分析战斗情境
     */
    private static AnalyzeBattleContext;
    /**
     * 评估技能得分
     */
    private static EvaluateSkill;
    /**
     * 检查是否有足够的PP
     */
    private static HasEnoughPP;
    /**
     * 判断是否是控制技能（睡眠、冰冻、混乱等强控制）
     */
    private static IsControlSkill;
    /**
     * 判断是否是增益技能
     */
    private static IsBuffSkill;
    /**
     * 判断是否是削弱技能
     */
    private static IsDebuffSkill;
    /**
     * 判断是否是异常状态技能
     */
    private static IsStatusSkill;
    /**
     * 检查精灵是否有正面增益
     */
    private static HasPositiveBuffs;
    /**
     * 检查精灵是否有负面削弱
     */
    private static HasNegativeBuffs;
    /**
     * 判断是否是连招技能
     * 某些技能组合使用有额外效果
     */
    private static IsComboSkill;
    /**
     * 添加随机性
     * @param score 原始评分
     * @param variance 波动幅度 (0-1)
     * @returns 添加随机波动后的评分
     */
    private static AddRandomness;
    /**
     * 获取AI难度系数
     * 可以根据敌人等级或类型调整AI智能程度
     */
    static GetDifficultyFactor(level: number): number;
    /**
     * 重置AI状态（新战斗开始时调用）
     */
    static Reset(): void;
}
//# sourceMappingURL=BattleAI.d.ts.map