/**
 * BOSS特性管理器
 *
 * 职责：作为BOSS特性的入口，委托给 PassiveEffectRunner 执行。
 *
 * 初始化流程：
 * 1. BattleInitService 调用 InitializeBossAbilities()
 * 2. 本类调用 PassiveEffectRunner.RegisterPassives() 注册被动特性
 * 3. 战斗过程中由 BattleEffectIntegration → PassiveEffectRunner.TriggerAtTiming() 自动触发
 * 4. 战斗结束时调用 CleanupBossAbilities()
 */
import { IBattlePet } from '../../../../shared/models/BattleModel';
import { IAbilityEntry } from './BossAbilityConfig';
/**
 * BOSS特性管理器
 */
export declare class BossAbilityManager {
    /**
     * 为BOSS初始化特性（战斗开始时调用）
     *
     * @param boss BOSS精灵
     * @param abilityEntries 特性条目列表（含参数）
     */
    static InitializeBossAbilities(boss: IBattlePet, abilityEntries: IAbilityEntry[]): void;
    /**
     * 清理BOSS特性（战斗结束时调用）
     *
     * @param boss BOSS精灵
     */
    static CleanupBossAbilities(boss: IBattlePet): void;
}
//# sourceMappingURL=BossAbilityManager.d.ts.map