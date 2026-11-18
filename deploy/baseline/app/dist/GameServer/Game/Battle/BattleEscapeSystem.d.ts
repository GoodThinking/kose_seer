/**
 * 战斗逃跑系统
 * 实现逃跑逻辑，包括逃跑成功率计算、逃跑限制等
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua (逃跑相关逻辑)
 * 参考: 前端 FightToolBar.as (逃跑按钮)
 */
import { IBattleInfo, IBattlePet } from '../../../shared/models/BattleModel';
/**
 * 逃跑结果
 */
export interface IEscapeResult {
    success: boolean;
    escapeRate: number;
    attempts: number;
    message: string;
    canRetry: boolean;
}
/**
 * 逃跑限制类型
 */
export declare enum EscapeRestriction {
    NONE = 0,// 无限制
    BOSS_BATTLE = 1,// BOSS战斗
    TRAPPED = 2,// 被束缚/困住
    SPECIAL_BATTLE = 3,// 特殊战斗
    MAX_ATTEMPTS = 4
}
/**
 * 逃跑系统类
 */
export declare class BattleEscapeSystem {
    private static readonly MAX_ESCAPE_ATTEMPTS;
    /**
     * 尝试逃跑
     *
     * 逃跑成功率公式 (参考宝可梦):
     * - 基础成功率 = (玩家速度 * 128) / (敌人速度 + 1) + 30 * 尝试次数
     * - 如果基础成功率 >= 256，则必定成功
     * - 否则，随机数 < (基础成功率 / 256) 则成功
     *
     * @param battle 战斗实例
     * @param escapeAttempts 已尝试次数
     * @returns 逃跑结果
     */
    static AttemptEscape(battle: IBattleInfo, escapeAttempts?: number): IEscapeResult;
    /**
     * 检查逃跑限制
     */
    private static CheckEscapeRestriction;
    /**
     * 获取限制消息
     */
    private static GetRestrictionMessage;
    /**
     * 获取有效速度
     * 考虑能力等级和状态效果
     */
    private static GetEffectiveSpeed;
    /**
     * 获取能力等级倍率
     */
    private static GetStageMultiplier;
    /**
     * 计算推荐逃跑时机
     * 返回当前是否是逃跑的好时机
     */
    static IsGoodTimeToEscape(battle: IBattleInfo): {
        isGood: boolean;
        reason: string;
        escapeRate: number;
    };
    /**
     * 检查是否可以逃跑
     */
    static CanEscape(battle: IBattleInfo, escapeAttempts?: number): {
        canEscape: boolean;
        reason?: string;
    };
    /**
     * 获取逃跑惩罚
     * 逃跑可能会有一些惩罚，如失去经验、金币等
     */
    static GetEscapePenalty(battle: IBattleInfo): {
        expLoss: number;
        coinLoss: number;
    };
    /**
     * 计算逃跑冷却时间
     * 防止玩家频繁尝试逃跑
     */
    static GetEscapeCooldown(escapeAttempts: number): number;
    /**
     * 获取逃跑成功率描述
     */
    static GetEscapeRateDescription(escapeRate: number): string;
    /**
     * 模拟逃跑动画时间
     */
    static GetEscapeAnimationDuration(): number;
    /**
     * 野生精灵逃跑判定
     * 某些野生精灵可能会主动逃跑
     */
    static WildPetEscape(enemy: IBattlePet, turn: number): boolean;
}
//# sourceMappingURL=BattleEscapeSystem.d.ts.map