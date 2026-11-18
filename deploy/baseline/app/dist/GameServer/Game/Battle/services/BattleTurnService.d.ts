import { IBattleInfo, ITurnResult, IAttackResult } from '../../../../shared/models/BattleModel';
import { PokeBallType } from '../BattleCaptureSystem';
/**
 * 战斗回合服务
 * 负责处理战斗回合逻辑、伤害计算、技能效果、捕获、逃跑等
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua
 */
export declare class BattleTurnService {
    private escapeAttempts;
    /**
     * 执行一个战斗回合（统一 PvE/PvP）
     *
     * @param battle 战斗实例
     * @param pet1SkillId 玩家/玩家1选择的技能ID
     * @param pet2SkillId PvP时玩家2的技能ID；undefined表示PvE模式（AI选技能）
     * @returns 回合结果
     */
    ExecuteTurn(battle: IBattleInfo, pet1SkillId: number, pet2SkillId?: number): ITurnResult;
    /**
     * 执行敌人回合（玩家使用道具/捕捉失败后，只有敌人攻击）
     * 用于捕捉失败、使用道具等场景
     */
    ExecuteEnemyTurn(battle: IBattleInfo): IAttackResult;
    /**
     * 加载技能配置到Map中
     */
    private LoadSkillConfig;
    /**
     * 处理逃跑
     *
     * 逃跑成功率计算：
     * - 基于玩家和敌人的速度差
     * - 每次失败后成功率提升
     * - BOSS战斗无法逃跑
     * - 被束缚状态无法逃跑
     */
    Escape(battle: IBattleInfo): boolean;
    /**
     * 尝试捕获精灵
     * @param battle 战斗信息
     * @param capsuleID 胶囊物品ID (300001=普通, 300002=中级, 300003=高级, 300004=超级, 300005+=大师球)
     */
    Catch(battle: IBattleInfo, capsuleID?: number): {
        success: boolean;
        catchTime: number;
        catchRate: number;
        shakeCount: number;
    };
    /**
     * 获取逃跑建议
     * 返回当前是否适合逃跑
     */
    GetEscapeAdvice(battle: IBattleInfo): {
        isGood: boolean;
        reason: string;
        escapeRate: number;
    };
    /**
     * 获取推荐精灵球
     * 根据目标状态推荐最合适的精灵球
     */
    GetRecommendedBall(battle: IBattleInfo): PokeBallType;
    /**
     * 清理战斗数据
     * 战斗结束后清理临时数据
     */
    CleanupBattle(battleId: number): void;
    /**
     * 将胶囊物品ID转换为精灵球类型
     * 300001=普通, 300002=中级, 300003=高级, 300004=超级, 300005+=大师球
     */
    private GetPokeBallType;
}
//# sourceMappingURL=BattleTurnService.d.ts.map