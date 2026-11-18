/**
 * 赛尔号战斗算法系统
 * 整合属性计算、伤害公式、速度判定等核心战斗逻辑
 *
 * 移植自: luvit/luvit_version/game/seer_algorithm.lua
 */
/**
 * 精灵种族值接口
 */
export interface IPetBaseStats {
    hp: number;
    attack: number;
    defence: number;
    spAtk: number;
    spDef: number;
    speed: number;
}
/**
 * 性格修正接口
 */
export interface INatureModifiers {
    attack: number;
    defence: number;
    spAtk: number;
    spDef: number;
    speed: number;
}
/**
 * 技能类型枚举
 *
 * 注意：XML中的Category值：
 * - 1 = 物理攻击
 * - 2 = 特殊攻击
 * - 4 = 变化技能（STATUS）
 */
export declare enum SkillCategory {
    PHYSICAL = 1,// 物理攻击
    SPECIAL = 2,// 特殊攻击
    STATUS = 4
}
/**
 * 计算后的属性值
 */
export interface ICalculatedStats {
    hp: number;
    maxHp: number;
    attack: number;
    defence: number;
    spAtk: number;
    spDef: number;
    speed: number;
}
/**
 * 努力值（学习力）
 */
export interface IEffortValues {
    hp: number;
    attack: number;
    defence: number;
    spAtk: number;
    spDef: number;
    speed: number;
}
/**
 * 伤害计算选项
 */
export interface IDamageOptions {
    isCrit?: boolean;
    weather?: number;
    sealBonus?: number;
    teamBonus?: number;
    otherBonus?: number;
}
/**
 * 伤害计算结果
 */
export interface IDamageResult {
    damage: number;
    effectiveness: number;
    isCrit: boolean;
}
/**
 * 战斗算法类
 */
export declare class BattleAlgorithm {
    /**
     * 计算精灵属性（完整版）
     *
     * 赛尔号属性计算公式（官方）:
     * - 体力: (种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 等级 + 10
     * - 非体力: [(种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 5] × 性格修正
     *
     * @param baseStats 种族值
     * @param level 等级 (1-100)
     * @param iv 个体值 (0-31)，越高越好
     * @param ev 学习力/努力值，每项0-255，总和≤510
     * @param natureId 性格ID (1-26)
     * @returns 计算后的属性值
     */
    static CalculateStats(baseStats: IPetBaseStats, level: number, iv?: number, ev?: IEffortValues, natureId?: number): ICalculatedStats;
    /**
     * 计算精灵属性（简化版）
     * 只用种族值和等级快速计算（用于NPC/野怪）
     *
     * @param baseStats 种族值
     * @param level 等级
     * @returns 计算后的属性值
     */
    static CalculateStatsSimple(baseStats: IPetBaseStats, level: number): ICalculatedStats;
    /**
     * 计算伤害
     *
     * 赛尔号基础伤害公式: (等级×0.4+2) × 威力 × 攻击÷防御 ÷ 50 + 2
     *
     * @param attackerStats 攻击方属性
     * @param defenderStats 防守方属性
     * @param attackerType 攻击方属性类型
     * @param defenderType 防守方属性类型
     * @param attackerLevel 攻击方等级
     * @param skillPower 技能威力
     * @param skillType 技能属性类型
     * @param skillCategory 技能类别
     * @param attackerStageModifiers 攻击方能力等级修正
     * @param defenderStageModifiers 防守方能力等级修正
     * @param options 可选参数
     * @returns 伤害计算结果
     */
    static CalculateDamage(attackerStats: ICalculatedStats, defenderStats: ICalculatedStats, attackerType: number, defenderType: number, attackerLevel: number, skillPower: number, skillType: number, skillCategory: SkillCategory, attackerStageModifiers?: number[], defenderStageModifiers?: number[], options?: IDamageOptions): IDamageResult;
    /**
     * 判断先手顺序
     *
     * @param attackerSpeed 攻击方速度
     * @param defenderSpeed 防守方速度
     * @param attackerPriority 攻击方技能优先度
     * @param defenderPriority 防守方技能优先度
     * @returns 1 (攻击方先手), -1 (防守方先手), 0 (同速随机)
     */
    static DetermineFirstMove(attackerSpeed: number, defenderSpeed: number, attackerPriority?: number, defenderPriority?: number): number;
    /**
     * 攻防速等能力等级倍率表 (等级 -6 到 +6)
     * 公式: 正向 (2+stage)/2, 负向 2/(2+|stage|)
     */
    private static readonly STAGE_MULTIPLIERS;
    /**
     * 命中/闪避能力等级倍率表 (等级 -6 到 +6)
     * 公式: 正向 (3+stage)/3, 负向 3/(3+|stage|)
     * 参考宝可梦第三世代起的独立命中/闪避倍率
     *
     * -6    -5    -4    -3    -2    -1     0    +1    +2   +3   +4    +5   +6
     * 3/9   3/8   3/7   3/6   3/5   3/4   1    4/3   5/3  6/3  7/3   8/3  9/3
     * 0.33  0.38  0.43  0.50  0.60  0.75  1.0  1.33  1.67 2.0  2.33  2.67 3.0
     */
    private static readonly ACC_EVA_STAGE_MULTIPLIERS;
    /**
     * 应用能力等级修正（攻击/防御/特攻/特防/速度）
     *
     * @param baseStat 基础属性值
     * @param stage 能力等级 (-6 到 +6)
     * @returns 修正后的属性值
     */
    static ApplyStageModifier(baseStat: number, stage: number): number;
    /**
     * 获取命中/闪避等级的倍率
     *
     * @param stage 命中或闪避等级 (-6 到 +6)
     * @returns 倍率 (如 +1 → 4/3 ≈ 1.333)
     */
    static GetAccuracyStageMultiplier(stage: number): number;
    /**
     * 计算最终命中率
     * 公式: baseAccuracy × (命中等级倍率 / 闪避等级倍率)
     *
     * 例: 技能命中80, 命中+1, 对方闪避+2
     *   = 80 × (4/3) / (5/3) = 80 × 4/5 = 64%
     *
     * @param baseAccuracy 技能基础命中率 (0-100)
     * @param accStage 攻击方命中等级 (-6 到 +6)
     * @param evaStage 防御方闪避等级 (-6 到 +6)
     * @returns 最终命中率百分比
     */
    static CalculateAccuracy(baseAccuracy: number, accStage: number, evaStage: number): number;
    /**
     * 属性克制表 (攻击属性 -> 被克制属性列表)
     * Type: 1草, 2水, 3火, 4飞行, 5电, 6机械, 7地面, 8普通, 9冰, 10超能, 11战斗, 12光, 13暗影, 14神秘, 15龙, 16圣灵
     */
    private static readonly TYPE_CHART;
    /**
     * 获取属性克制倍率
     *
     * @param atkType 攻击属性类型
     * @param defType 防守属性类型
     * @returns 克制倍率 (2.0=克制, 0.5=被克制, 1.0=普通)
     */
    static GetTypeEffectiveness(atkType: number, defType: number): number;
    /**
     * 获取性格修正
     *
     * @param natureId 性格ID
     * @returns 性格修正值
     */
    private static GetNatureModifiers;
    /**
     * 计算暴击率
     *
     * @param baseRate 基础暴击率 (默认6.25%)
     * @param critStage 暴击等级 (0-4)
     * @returns 暴击率 (0-1)
     */
    static CalculateCritRate(baseRate?: number, critStage?: number): number;
    /**
     * 计算命中率
     *
     * @param skillAccuracy 技能基础命中率 (0-100)
     * @param accuracyStage 命中等级 (-6 到 +6)
     * @param evasionStage 闪避等级 (-6 到 +6)
     * @returns 最终命中率 (0-1)
     */
    static CalculateHitRate(skillAccuracy: number, accuracyStage?: number, evasionStage?: number): number;
}
//# sourceMappingURL=BattleAlgorithm.d.ts.map