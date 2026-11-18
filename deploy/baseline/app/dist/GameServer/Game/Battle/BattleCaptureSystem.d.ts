/**
 * 战斗捕获系统
 * 实现精灵捕获逻辑，包括捕获率计算、精灵球效果等
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua (捕获相关逻辑)
 * 参考: 前端 CatchPetController.as
 */
import { IBattlePet } from '../../../shared/models/BattleModel';
/**
 * 精灵球类型枚举
 */
export declare enum PokeBallType {
    NORMAL = 1,// 普通精灵球
    INTERMEDIATE = 2,// 中级精灵球
    ADVANCED = 3,// 高级精灵球
    SUPER = 4,// 超级精灵球
    MASTER = 5
}
/**
 * 捕获结果
 */
export interface ICaptureResult {
    success: boolean;
    catchTime: number;
    catchRate: number;
    shakeCount: number;
    isCriticalCapture: boolean;
    message: string;
}
/**
 * 捕获系统类
 */
export declare class BattleCaptureSystem {
    /**
     * 尝试捕获精灵
     *
     * 捕获率公式 (参考赛尔号):
     * - 基础捕获率 = 精灵捕获难度系数
     * - HP修正 = (1 - 当前HP/最大HP) * 0.5 + 0.5
     * - 状态修正 = 有异常状态 ? 1.5 : 1.0
     * - 精灵球修正 = 精灵球倍率
     * - 最终捕获率 = 基础捕获率 * HP修正 * 状态修正 * 精灵球修正
     *
     * @param target 目标精灵
     * @param ballType 精灵球类型
     * @param baseCatchRate 基础捕获率 (0-100)
     * @returns 捕获结果
     */
    static AttemptCapture(target: IBattlePet, ballType?: PokeBallType, baseCatchRate?: number): ICaptureResult;
    /**
     * 获取精灵球修正倍率
     */
    private static GetBallModifier;
    /**
     * 计算推荐精灵球类型
     * 根据目标精灵状态推荐最合适的精灵球
     */
    static RecommendBall(target: IBattlePet, baseCatchRate?: number): PokeBallType;
    /**
     * 获取捕获难度描述
     */
    static GetDifficultyDescription(catchRate: number): string;
    /**
     * 检查是否可以捕获
     * 某些特殊精灵（如BOSS）可能无法捕获
     */
    static CanCapture(target: IBattlePet, isBoss?: boolean): {
        canCapture: boolean;
        reason?: string;
    };
    /**
     * 模拟捕获动画时间
     * 返回摇晃动画应该持续的时间（毫秒）
     */
    static GetCaptureAnimationDuration(shakeCount: number): number;
    /**
     * 计算捕获经验奖励
     * 捕获精灵可以获得额外经验
     */
    static CalculateCaptureExpBonus(target: IBattlePet): number;
    /**
     * 生成捕获时间戳
     * 用于唯一标识捕获的精灵
     */
    static GenerateCatchTime(): number;
    /**
     * 验证捕获时间戳
     * 检查捕获时间是否合法
     */
    static ValidateCatchTime(catchTime: number): boolean;
}
//# sourceMappingURL=BattleCaptureSystem.d.ts.map