/**
 * 战斗回合执行器
 * 负责执行完整的战斗回合逻辑
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua (executeTurn)
 */
import { IBattleInfo, ITurnResult } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
/**
 * 回合执行选项
 */
export interface ITurnOptions {
    /** PvP模式：双方技能由玩家指定，不使用AI */
    isPvp?: boolean;
    /** PvP中敌方（pet2）的userId */
    pet2UserId?: number;
}
/**
 * 战斗回合执行器类
 */
export declare class BattleTurnExecutor {
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
    static ExecuteTurn(battle: IBattleInfo, pet1SkillId: number, pet2SkillId: number, skillConfigs: Map<number, ISkillConfig>, options?: ITurnOptions): ITurnResult;
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
    private static ExecuteAttack;
    /**
     * 获取无动作技能（换精灵时使用，不产生攻击）
     */
    static GetNoActionSkill(): ISkillConfig;
    /**
     * 获取默认技能（撞击）
     */
    private static GetDefaultSkill;
    /**
     * 处理回合开始时的效果
     * 包括：克制效果、愤怒效果等需要在回合开始检查的效果
     */
    private static ProcessTurnStartEffects;
    /**
     * 处理回合结束时的效果
     * 包括：持续伤害、状态恢复等
     */
    private static ProcessTurnEndEffects;
}
//# sourceMappingURL=BattleTurnExecutor.d.ts.map