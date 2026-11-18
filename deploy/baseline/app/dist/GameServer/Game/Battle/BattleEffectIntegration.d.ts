/**
 * 战斗效果集成系统
 *
 * 负责在战斗流程的各个时机触发两类效果：
 * 1. 技能效果 — 由 EffectTrigger 从 skill.sideEffect 驱动
 * 2. 被动特性 — 由 PassiveEffectRunner 从 pet.effectCounters 驱动
 *
 * 触发时机（共29个）：
 * - BATTLE_START / BATTLE_END
 * - TURN_START / TURN_END
 * - ATTACK_START                          — 出手流程开始（异常扣血在此）
 * - BEFORE_SKILL / AFTER_SKILL
 * - BEFORE_SPEED_CHECK
 * - BEFORE_HIT_CHECK / HIT_CHECK / AFTER_HIT_CHECK
 * - ON_HIT                                — 命中时（需命中才触发，技能效果结算前）
 * - SKILL_EFFECT                           — 即时技能效果结算（命中后，伤害计算前）
 * - BEFORE_CRIT_CHECK / CRIT_CHECK
 * - BEFORE_DAMAGE_CALC / AFTER_DAMAGE_CALC
 * - BEFORE_DAMAGE_APPLY / AFTER_DAMAGE_APPLY
 * - ON_HP_CHANGE / ON_ATTACKED / ON_ATTACK
 * - ON_KO / AFTER_KO
 * - ON_RECEIVE_DAMAGE / ON_EVADE
 * - ATTACK_END                             — 出手流程结束时（单次攻击结束）
 * - AFTER_ATTACK_END                       — 出手流程结束后（双方攻击都完成后）
 */
import { IBattlePet, IBattleInfo } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { IEffectResult } from './effects/core/EffectContext';
/**
 * 速度判定前效果的结构化返回
 * 包含双方的先制修正信息
 */
export interface ISpeedCheckModifiers {
    results: IEffectResult[];
    /** 玩家侧（attacker / pet1） */
    playerAlwaysFirst: boolean;
    playerPriorityMod: number;
    /** 敌方侧（defender / pet2） */
    enemyAlwaysFirst: boolean;
    enemyPriorityMod: number;
}
/**
 * 战斗效果集成器
 */
export declare class BattleEffectIntegration {
    /**
     * 通用时机触发：技能效果 + 双方被动特性
     * 大部分时机（BEFORE_SKILL, ON_HIT, ON_KO 等）共享此流程
     */
    private static TriggerAtTiming;
    private static GetResultType;
    private static CollectSpeedModifiers;
    private static ApplyAfterDamageCalcResult;
    private static ApplyBeforeDamageApplyResult;
    /**
     * 战斗开始时触发效果
     */
    static OnBattleStart(battle: IBattleInfo): IEffectResult[];
    /**
     * 战斗结束时触发效果
     */
    static OnBattleEnd(battle: IBattleInfo, winnerId: number): IEffectResult[];
    /**
     * 回合开始时触发效果
     */
    static OnTurnStart(battle: IBattleInfo): IEffectResult[];
    /**
     * 回合结束时触发效果
     */
    static OnTurnEnd(battle: IBattleInfo): IEffectResult[];
    /**
     * 速度判定前触发效果
     * 返回结构化的速度修正信息，包含双方的 alwaysFirst 和 priorityModifier
     */
    static OnBeforeSpeedCheck(attacker: IBattlePet, defender: IBattlePet, attackerSkill: ISkillConfig, defenderSkill: ISkillConfig): ISpeedCheckModifiers;
    /**
     * 技能使用前触发效果
     */
    static OnBeforeSkill(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 技能使用后触发效果
     */
    static OnAfterSkill(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, damage: number): IEffectResult[];
    /**
     * 命中判定前触发效果
     */
    static OnBeforeHitCheck(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 命中判定时触发效果
     */
    static OnHitCheck(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 命中判定后触发效果
     */
    static OnAfterHitCheck(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, hit: boolean): IEffectResult[];
    /**
     * 暴击判定前触发效果
     */
    static OnBeforeCritCheck(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 暴击判定时触发效果
     */
    static OnCritCheck(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 伤害计算前触发效果
     */
    static OnBeforeDamageCalc(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 伤害计算后触发效果
     *
     * 关键时机：BOSS被动的伤害减免、同系吸收、属性免疫在此触发
     */
    static OnAfterDamageCalc(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, damage: number): {
        damage: number;
        results: IEffectResult[];
    };
    /**
     * 伤害应用前触发效果
     */
    static OnBeforeDamageApply(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, damage: number): {
        damage: number;
        results: IEffectResult[];
    };
    /**
     * 伤害应用后触发效果
     */
    static OnAfterDamageApply(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, damage: number): IEffectResult[];
    /**
     * 受到攻击时触发效果
     */
    static OnAttacked(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 攻击时触发效果
     */
    static OnAttack(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 受到伤害时触发效果
     */
    static OnReceiveDamage(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, damage: number): IEffectResult[];
    /**
     * 击败对手时触发效果
     */
    static OnKO(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 击败对方后触发效果
     */
    static OnAfterKO(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * HP变化时触发效果
     */
    static OnHPChange(pet: IBattlePet, opponent: IBattlePet, oldHP: number, newHP: number): IEffectResult[];
    /**
     * 闪避时触发效果
     */
    static OnEvade(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 阶段1: 出手流程开始
     * - 处理 defender 身上的异常扣血（先手方挂在对手身上的异常先生效）
     * - 触发 ATTACK_START 时机的被动/技能效果
     *
     * @returns 包含状态伤害值的效果结果
     */
    static OnAttackStart(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): {
        statusDamage: number;
        results: IEffectResult[];
    };
    /**
     * 阶段3: 命中时
     */
    static OnHit(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 阶段4: 即时技能效果结算
     */
    static OnSkillEffect(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig): IEffectResult[];
    /**
     * 阶段8: 出手流程结束时
     */
    static OnAttackEnd(attacker: IBattlePet, defender: IBattlePet, skill: ISkillConfig, damage: number): IEffectResult[];
    /**
     * 阶段9: 出手流程结束后
     * - 双方攻击都完成后触发
     * - 击杀控、星皇之赐等效果在此触发
     */
    static OnAfterAttackEnd(battle: IBattleInfo): IEffectResult[];
    /**
     * 处理回合开始效果
     */
    private static GetOnHitMultiStatChangeAtom;
    private static TriggerOnHitCounterEffects;
    private static ApplyTurnStartStatusDamage;
    private static ProcessTurnStartEffects;
    /**
     * 处理回合结束效果
     */
    private static ProcessTurnEndEffects;
    /**
     * 递减状态持续时间
     */
    private static DecrementStatusDurations;
    /**
     * 递减效果计数器
     */
    private static DecrementEffectCounters;
    /**
     * 处理单个过期效果
     */
    private static HandleExpiredEffect;
    /**
     * 清理战斗效果
     */
    private static CleanupBattleEffects;
}
//# sourceMappingURL=BattleEffectIntegration.d.ts.map