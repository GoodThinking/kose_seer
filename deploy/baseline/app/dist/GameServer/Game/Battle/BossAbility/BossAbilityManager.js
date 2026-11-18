"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BossAbilityManager = void 0;
const utils_1 = require("../../../../shared/utils");
const PassiveEffectRunner_1 = require("../PassiveEffectRunner");
/**
 * BOSS特性管理器
 */
class BossAbilityManager {
    /**
     * 为BOSS初始化特性（战斗开始时调用）
     *
     * @param boss BOSS精灵
     * @param abilityEntries 特性条目列表（含参数）
     */
    static InitializeBossAbilities(boss, abilityEntries) {
        utils_1.Logger.Info(`[BossAbilityManager] 初始化BOSS特性: ${boss.name}, ` +
            `特性数=${abilityEntries.length}, ID=[${abilityEntries.map(e => e.id).join(', ')}]`);
        PassiveEffectRunner_1.PassiveEffectRunner.RegisterPassives(boss, abilityEntries);
    }
    /**
     * 清理BOSS特性（战斗结束时调用）
     *
     * @param boss BOSS精灵
     */
    static CleanupBossAbilities(boss) {
        PassiveEffectRunner_1.PassiveEffectRunner.CleanupPassives(boss);
        // 清理旧版 boss_ 前缀的标记（兼容性）
        if (boss.effectCounters) {
            const keysToDelete = Object.keys(boss.effectCounters).filter(key => key.startsWith('boss_'));
            for (const key of keysToDelete) {
                delete boss.effectCounters[key];
            }
        }
        utils_1.Logger.Debug(`[BossAbilityManager] 清理BOSS特性: ${boss.name}`);
    }
}
exports.BossAbilityManager = BossAbilityManager;
//# sourceMappingURL=BossAbilityManager.js.map