"use strict";
/**
 * 赛尔号战斗算法系统
 * 整合属性计算、伤害公式、速度判定等核心战斗逻辑
 *
 * 移植自: luvit/luvit_version/game/seer_algorithm.lua
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleAlgorithm = exports.SkillCategory = void 0;
const NatureSystem_1 = require("./NatureSystem");
/**
 * 技能类型枚举
 *
 * 注意：XML中的Category值：
 * - 1 = 物理攻击
 * - 2 = 特殊攻击
 * - 4 = 变化技能（STATUS）
 */
var SkillCategory;
(function (SkillCategory) {
    SkillCategory[SkillCategory["PHYSICAL"] = 1] = "PHYSICAL";
    SkillCategory[SkillCategory["SPECIAL"] = 2] = "SPECIAL";
    SkillCategory[SkillCategory["STATUS"] = 4] = "STATUS";
})(SkillCategory || (exports.SkillCategory = SkillCategory = {}));
/**
 * 战斗算法类
 */
class BattleAlgorithm {
    // ==================== 属性计算 ====================
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
    static CalculateStats(baseStats, level, iv = 31, ev, natureId) {
        // 默认值
        ev = ev || { hp: 0, attack: 0, defence: 0, spAtk: 0, spDef: 0, speed: 0 };
        natureId = natureId ?? 21; // 未提供时使用平衡性格，保留合法ID 0（孤独）
        level = Math.max(1, Math.min(100, level));
        // 获取性格修正
        const natureMods = this.GetNatureModifiers(natureId);
        // 体力计算（不受性格影响）
        // 公式: (种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 等级 + 10
        const hp = Math.floor((baseStats.hp * 2 + iv + ev.hp / 4) * level / 100 + level + 10);
        // 非体力属性计算
        // 公式: [(种族值×2 + 个体值 + 学习力÷4) × 等级÷100 + 5] × 性格修正
        const calcStat = (base, evVal, natureMod) => {
            const basePart = (base * 2 + iv + evVal / 4) * level / 100 + 5;
            return Math.floor(basePart * natureMod);
        };
        return {
            hp,
            maxHp: hp,
            attack: calcStat(baseStats.attack, ev.attack, natureMods.attack),
            defence: calcStat(baseStats.defence, ev.defence, natureMods.defence),
            spAtk: calcStat(baseStats.spAtk, ev.spAtk, natureMods.spAtk),
            spDef: calcStat(baseStats.spDef, ev.spDef, natureMods.spDef),
            speed: calcStat(baseStats.speed, ev.speed, natureMods.speed),
        };
    }
    /**
     * 计算精灵属性（简化版）
     * 只用种族值和等级快速计算（用于NPC/野怪）
     *
     * @param baseStats 种族值
     * @param level 等级
     * @returns 计算后的属性值
     */
    static CalculateStatsSimple(baseStats, level) {
        level = Math.max(1, Math.min(100, level));
        // 假设个体值15（中等），无学习力，平衡性格
        const iv = 15;
        const hp = Math.floor((baseStats.hp * 2 + iv) * level / 100 + level + 10);
        const calcStat = (base) => {
            return Math.floor((base * 2 + iv) * level / 100 + 5);
        };
        return {
            hp,
            maxHp: hp,
            attack: calcStat(baseStats.attack),
            defence: calcStat(baseStats.defence),
            spAtk: calcStat(baseStats.spAtk),
            spDef: calcStat(baseStats.spDef),
            speed: calcStat(baseStats.speed),
        };
    }
    // ==================== 伤害计算 ====================
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
    static CalculateDamage(attackerStats, defenderStats, attackerType, defenderType, attackerLevel, skillPower, skillType, skillCategory, attackerStageModifiers, defenderStageModifiers, options) {
        options = options || {};
        // 变化技不造成伤害
        if (skillCategory === SkillCategory.STATUS) {
            return { damage: 0, effectiveness: 1, isCrit: false };
        }
        const level = attackerLevel || 100;
        const power = skillPower || 40;
        // 根据技能类型选择攻击/防御属性
        let atkStat;
        let defStat;
        if (skillCategory === SkillCategory.PHYSICAL) {
            // 物理攻击
            atkStat = attackerStats.attack;
            defStat = defenderStats.defence;
            // 应用能力等级修正
            if (attackerStageModifiers && attackerStageModifiers[0] !== undefined) {
                atkStat = this.ApplyStageModifier(atkStat, attackerStageModifiers[0]);
            }
            if (defenderStageModifiers && defenderStageModifiers[1] !== undefined) {
                defStat = this.ApplyStageModifier(defStat, defenderStageModifiers[1]);
            }
        }
        else {
            // 特殊攻击
            atkStat = attackerStats.spAtk;
            defStat = defenderStats.spDef;
            // 应用能力等级修正
            if (attackerStageModifiers && attackerStageModifiers[2] !== undefined) {
                atkStat = this.ApplyStageModifier(atkStat, attackerStageModifiers[2]);
            }
            if (defenderStageModifiers && defenderStageModifiers[3] !== undefined) {
                defStat = this.ApplyStageModifier(defStat, defenderStageModifiers[3]);
            }
        }
        // 防止除零
        defStat = Math.max(1, defStat);
        // 赛尔号基础伤害公式: (等级×0.4+2) × 威力 × 攻击÷防御 ÷ 50 + 2
        const baseDamage = (level * 0.4 + 2) * power * atkStat / defStat / 50 + 2;
        // 属性克制倍率
        const effectiveness = Math.max(options.minEffectiveness || 0, this.GetTypeEffectiveness(skillType, defenderType));
        const stab = require('./ElementSystem').ElementSystem.GetSTABMultiplier(attackerType, undefined, skillType, undefined);
        // 暴击判定 (默认6.25%几率, 伤害1.5倍)
        let isCrit = options.isCrit !== undefined ? options.isCrit : Math.random() < 0.0625;
        const critMod = isCrit ? 1.5 : 1.0;
        // 随机波动 (85%-100%)
        const randomMod = (85 + Math.random() * 15) / 100;
        // 刻印加成 (可选)
        const sealBonus = options.sealBonus || 1.0;
        // 战队加成 (可选)
        const teamBonus = options.teamBonus || 1.0;
        // 其他加成 (天气、道具等)
        const otherBonus = options.otherBonus || 1.0;
        // 最终伤害
        let finalDamage = Math.floor(baseDamage * effectiveness * stab * critMod * randomMod *
            sealBonus * teamBonus * otherBonus);
        // 最小伤害为1（除非无效）
        if (effectiveness > 0 && finalDamage < 1) {
            finalDamage = 1;
        }
        return {
            damage: finalDamage,
            effectiveness,
            isCrit
        };
    }
    // ==================== 速度判定 ====================
    /**
     * 判断先手顺序
     *
     * @param attackerSpeed 攻击方速度
     * @param defenderSpeed 防守方速度
     * @param attackerPriority 攻击方技能优先度
     * @param defenderPriority 防守方技能优先度
     * @returns 1 (攻击方先手), -1 (防守方先手), 0 (同速随机)
     */
    static DetermineFirstMove(attackerSpeed, defenderSpeed, attackerPriority = 0, defenderPriority = 0) {
        // 先比较技能优先度
        if (attackerPriority > defenderPriority) {
            return 1;
        }
        else if (attackerPriority < defenderPriority) {
            return -1;
        }
        // 优先度相同，比较速度
        if (attackerSpeed > defenderSpeed) {
            return 1;
        }
        else if (attackerSpeed < defenderSpeed) {
            return -1;
        }
        else {
            // 同速随机
            return Math.random() < 0.5 ? 1 : -1;
        }
    }
    // ==================== 能力等级系统 ====================
    /**
     * 攻防速等能力等级倍率表 (等级 -6 到 +6)
     * 公式: 正向 (2+stage)/2, 负向 2/(2+|stage|)
     */
    static STAGE_MULTIPLIERS = {
        [-6]: 2 / 8, [-5]: 2 / 7, [-4]: 2 / 6, [-3]: 2 / 5, [-2]: 2 / 4, [-1]: 2 / 3,
        [0]: 1,
        [1]: 3 / 2, [2]: 4 / 2, [3]: 5 / 2, [4]: 6 / 2, [5]: 7 / 2, [6]: 8 / 2
    };
    /**
     * 命中/闪避能力等级倍率表 (等级 -6 到 +6)
     * 公式: 正向 (3+stage)/3, 负向 3/(3+|stage|)
     * 参考宝可梦第三世代起的独立命中/闪避倍率
     *
     * -6    -5    -4    -3    -2    -1     0    +1    +2   +3   +4    +5   +6
     * 3/9   3/8   3/7   3/6   3/5   3/4   1    4/3   5/3  6/3  7/3   8/3  9/3
     * 0.33  0.38  0.43  0.50  0.60  0.75  1.0  1.33  1.67 2.0  2.33  2.67 3.0
     */
    static ACC_EVA_STAGE_MULTIPLIERS = {
        [-6]: 3 / 9, [-5]: 3 / 8, [-4]: 3 / 7, [-3]: 3 / 6, [-2]: 3 / 5, [-1]: 3 / 4,
        [0]: 1,
        [1]: 4 / 3, [2]: 5 / 3, [3]: 6 / 3, [4]: 7 / 3, [5]: 8 / 3, [6]: 9 / 3
    };
    /**
     * 应用能力等级修正（攻击/防御/特攻/特防/速度）
     *
     * @param baseStat 基础属性值
     * @param stage 能力等级 (-6 到 +6)
     * @returns 修正后的属性值
     */
    static ApplyStageModifier(baseStat, stage) {
        stage = Math.max(-6, Math.min(6, stage));
        const multiplier = this.STAGE_MULTIPLIERS[stage] || 1;
        return Math.floor(baseStat * multiplier);
    }
    /**
     * 获取命中/闪避等级的倍率
     *
     * @param stage 命中或闪避等级 (-6 到 +6)
     * @returns 倍率 (如 +1 → 4/3 ≈ 1.333)
     */
    static GetAccuracyStageMultiplier(stage) {
        stage = Math.max(-6, Math.min(6, stage));
        return this.ACC_EVA_STAGE_MULTIPLIERS[stage] || 1;
    }
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
    static CalculateAccuracy(baseAccuracy, accStage, evaStage) {
        const accMul = this.GetAccuracyStageMultiplier(accStage);
        const evaMul = this.GetAccuracyStageMultiplier(evaStage);
        return Math.floor(baseAccuracy * accMul / evaMul);
    }
    // ==================== 属性克制系统 ====================
    /**
     * 属性克制表 (攻击属性 -> 被克制属性列表)
     * Type: 1草, 2水, 3火, 4飞行, 5电, 6机械, 7地面, 8普通, 9冰, 10超能, 11战斗, 12光, 13暗影, 14神秘, 15龙, 16圣灵
     */
    static TYPE_CHART = {
        [1]: [2, 7], // 草克水、地面
        [2]: [3, 7], // 水克火、地面
        [3]: [1, 6, 9], // 火克草、机械、冰
        [4]: [1, 11], // 飞行克草、战斗
        [5]: [2, 4], // 电克水、飞行
        [6]: [9], // 机械克冰
        [7]: [3, 5, 6], // 地面克火、电、机械
        [8]: [], // 普通无克制
        [9]: [1, 4, 7, 15], // 冰克草、飞行、地面、龙
        [10]: [11], // 超能克战斗
        [11]: [8, 9], // 战斗克普通、冰
        [12]: [13], // 光克暗影
        [13]: [10, 12], // 暗影克超能、光
        [14]: [], // 神秘
        [15]: [15], // 龙克龙
        [16]: [13, 15] // 圣灵克暗影、龙
    };
    /**
     * 获取属性克制倍率
     *
     * @param atkType 攻击属性类型
     * @param defType 防守属性类型
     * @returns 克制倍率 (2.0=克制, 0.5=被克制, 1.0=普通)
     */
    static GetTypeEffectiveness(atkType, defType) {
        return require('./ElementSystem').ElementSystem.GetEffectiveness(atkType, defType);
    }
    // ==================== 辅助方法 ====================
    /**
     * 获取性格修正
     *
     * @param natureId 性格ID
     * @returns 性格修正值
     */
    static GetNatureModifiers(natureId) {
        return {
            attack: NatureSystem_1.NatureSystem.GetStatModifier(natureId, NatureSystem_1.StatType.ATTACK),
            defence: NatureSystem_1.NatureSystem.GetStatModifier(natureId, NatureSystem_1.StatType.DEFENCE),
            spAtk: NatureSystem_1.NatureSystem.GetStatModifier(natureId, NatureSystem_1.StatType.SP_ATTACK),
            spDef: NatureSystem_1.NatureSystem.GetStatModifier(natureId, NatureSystem_1.StatType.SP_DEFENCE),
            speed: NatureSystem_1.NatureSystem.GetStatModifier(natureId, NatureSystem_1.StatType.SPEED)
        };
    }
    /**
     * 计算暴击率
     *
     * @param baseRate 基础暴击率 (默认6.25%)
     * @param critStage 暴击等级 (0-4)
     * @returns 暴击率 (0-1)
     */
    static CalculateCritRate(baseRate = 0.0625, critStage = 0) {
        // 暴击等级倍率: 0=1x, 1=2x, 2=3x, 3=4x, 4=5x
        const multiplier = Math.min(5, critStage + 1);
        return Math.min(1.0, baseRate * multiplier);
    }
    /**
     * 计算命中率
     *
     * @param skillAccuracy 技能基础命中率 (0-100)
     * @param accuracyStage 命中等级 (-6 到 +6)
     * @param evasionStage 闪避等级 (-6 到 +6)
     * @returns 最终命中率 (0-1)
     */
    static CalculateHitRate(skillAccuracy, accuracyStage = 0, evasionStage = 0) {
        // 基础命中率
        let hitRate = skillAccuracy / 100;
        // 应用命中/闪避等级修正
        const netStage = accuracyStage - evasionStage;
        const stageMultiplier = this.ApplyStageModifier(100, netStage) / 100;
        hitRate *= stageMultiplier;
        return Math.max(0, Math.min(1, hitRate));
    }
}
exports.BattleAlgorithm = BattleAlgorithm;
//# sourceMappingURL=BattleAlgorithm.js.map