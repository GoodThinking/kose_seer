/**
 * 技能效果触发器
 * 负责在战斗中触发和应用技能效果
 *
 * 集成原子效果系统到战斗流程
 *
 * 支持多效果技能：
 * - 单效果: SideEffect="4", SideEffectArg="0 100 1"
 * - 多效果: SideEffect="4 4 4", SideEffectArg="0 100 1 1 100 1 2 100 1"
 *
 * 使用原子效果组合：
 * - 从 skill_effects_v2.json 读取 atomicComposition 配置
 * - 使用 AtomicEffectFactory 创建原子效果实例
 * - 执行原子效果组合并返回结果
 */
import { IBattlePet } from '../../../shared/models/BattleModel';
import { ISkillConfig } from '../../../shared/models/SkillModel';
import { EffectTiming, IEffectResult } from './effects/core/EffectContext';
/**
 * 效果触发器类
 */
export declare class EffectTrigger {
    /**
     * 触发技能的所有附加效果（支持多效果）
     *
     * @param skill 技能配置
     * @param attacker 攻击方
     * @param defender 防守方
     * @param damage 造成的伤害
     * @param timing 触发时机
     * @returns 效果结果数组
     */
    static TriggerSkillEffect(skill: ISkillConfig, attacker: IBattlePet, defender: IBattlePet, damage: number, timing: EffectTiming): IEffectResult[];
    /**
     * 触发单个技能效果（使用原子效果组合）
     *
     * @param skill 技能配置
     * @param attacker 攻击方
     * @param defender 防守方
     * @param damage 造成的伤害
     * @param timing 触发时机
     * @returns 效果结果数组
     */
    private static TriggerSingleSkillEffect;
    /**
     * 触发多个技能效果（使用原子效果组合）
     *
     * 示例：
     * SideEffect="4 4 4 4 4 4"
     * SideEffectArg="0 100 1 1 100 1 2 100 1 3 100 1 4 100 1 5 100 1"
     *
     * @param skill 技能配置
     * @param attacker 攻击方
     * @param defender 防守方
     * @param damage 造成的伤害
     * @param timing 触发时机
     * @returns 效果结果数组
     */
    private static TriggerMultipleSkillEffects;
    /**
     * 解析效果参数字符串
     *
     * @param sideEffectArg 参数字符串或数字，例如 "10" 或 10 或 "2 5" 或 "0 100 1"
     * @returns 参数数组
     */
    private static ParseEffectArgs;
    /**
     * 批量触发效果（用于多个时机）
     */
    static TriggerMultipleEffects(skill: ISkillConfig, attacker: IBattlePet, defender: IBattlePet, damage: number, timings: EffectTiming[]): IEffectResult[];
    /**
     * 应用效果结果到战斗精灵（委托给 EffectApplicator）
     */
    static ApplyEffectResults(results: IEffectResult[], attacker: IBattlePet, defender: IBattlePet): void;
    /**
     * 检查效果是否应该触发（概率判定）
     */
    static ShouldTrigger(chance: number): boolean;
    /**
     * 参数名到嵌套原子效果字段的映射
     * args中定义的name → 实际原子效果中的字段名
     */
    private static readonly ARG_FIELD_MAP;
    /**
     * 将参数传播到嵌套的 then/else 子效果中
     * 解决 conditional 包裹 stat_modifier 等场景下参数丢失的问题
     */
    private static PropagateArgsToNestedAtoms;
}
//# sourceMappingURL=EffectTrigger.d.ts.map