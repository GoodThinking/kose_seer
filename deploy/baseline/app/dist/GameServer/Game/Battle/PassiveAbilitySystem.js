"use strict";
/**
 * 被动能力系统（兼容层）
 *
 * 保留原有接口以兼容 BattleInitService 等调用方。
 * 实际功能委托给 BossAbilityManager → PassiveEffectRunner。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PassiveAbilitySystem = void 0;
const utils_1 = require("../../../shared/utils");
const BossAbilityManager_1 = require("./BossAbility/BossAbilityManager");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
/**
 * 被动能力系统类
 */
class PassiveAbilitySystem {
    /**
     * 在战斗开始时触发精灵的所有被动能力
     *
     * @param pet 精灵对象
     * @param opponent 对手精灵
     * @returns 空数组（实际效果由 PassiveEffectRunner 在各时机自动触发）
     */
    static TriggerPassiveAbilities(pet, opponent) {
        // 1. 从配置读取BOSS特性（含参数）
        const bossAbilityEntries = (pet.bossAbilityEntries || []);
        if (bossAbilityEntries.length > 0) {
            BossAbilityManager_1.BossAbilityManager.InitializeBossAbilities(pet, bossAbilityEntries);
        }
        // 2. 从玩家精灵的effectList加载特性
        const playerAbilityEntries = this.LoadPlayerAbilities(pet);
        if (playerAbilityEntries.length > 0) {
            BossAbilityManager_1.BossAbilityManager.InitializeBossAbilities(pet, playerAbilityEntries);
            utils_1.Logger.Info(`[PassiveAbilitySystem] 玩家特性加载: petId=${pet.petId}, count=${playerAbilityEntries.length}`);
        }
        return [];
    }
    /**
     * 从玩家精灵的effectList加载特性配置
     */
    static LoadPlayerAbilities(pet) {
        const entries = [];
        // 检查精灵是否有特性列表
        const effectList = pet.effectList;
        if (!effectList || !Array.isArray(effectList)) {
            return entries;
        }
        for (const effect of effectList) {
            // 特性状态2表示已激活
            if (effect.status !== 2) {
                continue;
            }
            const abilityId = effect.itemId ?? effect.effectID;
            if (abilityId === undefined || abilityId === null) {
                utils_1.Logger.Warn(`[PassiveAbilitySystem] 特性数据缺少 itemId/effectID: ${JSON.stringify(effect)}`);
                continue;
            }
            // 从pet_abilities.json获取特性配置
            const abilityConfig = GameConfig_1.GameConfig.GetPetAbilityById(abilityId);
            if (abilityConfig) {
                entries.push({
                    id: abilityConfig.effectId,
                    args: abilityConfig.args || [],
                });
                utils_1.Logger.Info(`[PassiveAbilitySystem] 加载玩家特性: ${abilityConfig.name}, effectId=${abilityConfig.effectId}`);
            }
            else {
                utils_1.Logger.Warn(`[PassiveAbilitySystem] 未找到特性配置: abilityId=${abilityId}`);
            }
        }
        return entries;
    }
    /**
     * 为精灵配置被动能力（运行时配置）
     *
     * @deprecated 请在 boss_abilities.json 中配置
     */
    static ConfigurePassiveAbilities(petId, abilityIds) {
        utils_1.Logger.Warn(`[PassiveAbilitySystem] ConfigurePassiveAbilities已废弃，` +
            `请在 boss_abilities.json 中配置: petId=${petId}, abilities=[${abilityIds.join(', ')}]`);
    }
}
exports.PassiveAbilitySystem = PassiveAbilitySystem;
//# sourceMappingURL=PassiveAbilitySystem.js.map