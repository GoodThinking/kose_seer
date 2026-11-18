/**
 * 赛尔号战斗核心系统
 * 完整实现战斗逻辑、状态效果、AI等
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua
 */
import { IBattlePet } from "../../../shared/models/BattleModel";
import { ISkillConfig } from "../../../shared/models/SkillModel";
/**
 * 战斗状态枚举
 */
export declare enum BattleStatusType {
    PARALYSIS = 0,// 麻痹
    POISON = 1,// 中毒
    BURN = 2,// 烧伤
    DRAIN = 3,// 吸取对方体力
    DRAINED = 4,// 被对方吸取体力
    FREEZE = 5,// 冻伤
    FEAR = 6,// 害怕
    FATIGUE = 7,// 疲惫
    SLEEP = 8,// 睡眠
    PETRIFY = 9,// 石化
    CONFUSION = 10,// 混乱
    WEAKNESS = 11,// 衰弱
    MOUNTAIN_GUARD = 12,// 山神守护
    FLAMMABLE = 13,// 易燃
    RAGE = 14,// 狂暴
    ICE_SEAL = 15,// 冰封
    BLEED = 16,// 流血
    IMMUNE_DOWN = 17,// 免疫能力下降
    IMMUNE_STATUS = 18
}
/**
 * 无法行动的原因
 */
export interface ICannotActReason {
    canAct: boolean;
    reason?: string;
}
/**
 * 战斗核心类
 */
export declare class BattleCore {
    /**
     * 处理回合开始时的状态效果
     * 返回状态造成的伤害
     */
    static ProcessStatusEffects(pet: IBattlePet): number;
    /**
     * 检查精灵是否可以行动
     */
    static CanAct(pet: IBattlePet): ICannotActReason;
    /**
     * 检查是否命中
     *
     * 注意：此方法内部会触发 HIT_CHECK 效果，允许效果修改命中结果
     */
    static CheckHit(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): boolean;
    /**
     * 检查是否暴击
     * 考虑特殊暴击条件
     *
     * 注意：此方法内部会触发 CRIT_CHECK 效果，允许效果修改暴击结果
     */
    static CheckCrit(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, isFirst: boolean): boolean;
    /**
     * 比较速度决定先后攻
     *
     * @param modifiers 来自被动特性的先制修正（alwaysFirst、priorityMod）
     * @returns true 表示 pet1 先手
     */
    static CompareSpeed(pet1: IBattlePet, pet2: IBattlePet, skill1: ISkillConfig, skill2: ISkillConfig, modifiers?: {
        pet1AlwaysFirst?: boolean;
        pet2AlwaysFirst?: boolean;
        pet1PriorityMod?: number;
        pet2PriorityMod?: number;
    }): boolean;
    /**
     * AI选择技能（同步版本）
     * 使用 BattleAI 系统进行智能选择
     */
    static AISelectSkill(aiPet: IBattlePet, playerPet: IBattlePet, skills: number[], skillConfigs: Map<number, ISkillConfig>): number;
    /**
     * 计算伤害（使用 BattleAlgorithm）
     * @param skillPower 可选的技能威力（用于烧伤等状态降低威力）
     */
    static CalculateDamage(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, isCrit: boolean, skillPower?: number): {
        damage: number;
        effectiveness: number;
        isCrit: boolean;
    };
}
//# sourceMappingURL=BattleCore.d.ts.map