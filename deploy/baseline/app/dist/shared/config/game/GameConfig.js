"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameConfig = void 0;
const ConfigRegistry_1 = require("../../../shared/config/ConfigRegistry");
const ConfigDefinitions_1 = require("../../../shared/config/ConfigDefinitions");
const utils_1 = require("../../../shared/utils");
const SkillEffectsConfig_1 = require("./SkillEffectsConfig");
const BossAbilityConfig_1 = require("../../../GameServer/Game/Battle/BossAbility/BossAbilityConfig");
/**
 * 游戏配置管理器
 * 提供类型安全的配置访问接口
 */
class GameConfig {
    static _natureConfigSource = null;
    static _natureConfigNormalized = null;
    static _petAbilitiesSource = null;
    static _petAbilitiesNormalized = null;
    static ToNumber(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === 'string' && value.trim() !== '') {
            const n = Number(value);
            return Number.isFinite(n) ? n : null;
        }
        return null;
    }
    static ToNumberArray(value) {
        if (Array.isArray(value)) {
            return value
                .map(v => this.ToNumber(v))
                .filter((v) => v !== null);
        }
        if (typeof value === 'string') {
            const parts = value.split(/[\s,]+/).filter(Boolean);
            return parts
                .map(v => this.ToNumber(v))
                .filter((v) => v !== null);
        }
        return [];
    }
    static NormalizeNatureConfig(raw) {
        if (!raw) {
            return null;
        }
        const source = Array.isArray(raw) ? raw : raw.natures;
        if (!Array.isArray(source)) {
            return null;
        }
        const natures = source
            .map((nature, index) => {
            const id = this.ToNumber(nature?.id ?? nature?.natureId ?? nature?.ID ?? index);
            if (id === null) {
                return null;
            }
            const category = typeof nature?.category === 'string' && nature.category.trim() !== ''
                ? nature.category
                : 'balanced';
            return {
                ...nature,
                id,
                name: typeof nature?.name === 'string' ? nature.name : `nature_${id}`,
                upStat: this.ToNumber(nature?.upStat ?? nature?.up ?? nature?.statUp) ?? undefined,
                downStat: this.ToNumber(nature?.downStat ?? nature?.down ?? nature?.statDown) ?? undefined,
                category,
            };
        })
            .filter((n) => n !== null);
        const base = (!Array.isArray(raw) && typeof raw === 'object') ? raw : {};
        return {
            ...base,
            natures,
        };
    }
    static NormalizePetAbilitiesConfig(raw) {
        if (!raw) {
            return null;
        }
        const source = Array.isArray(raw)
            ? raw
            : (Array.isArray(raw.abilities) ? raw.abilities : raw.data);
        if (!Array.isArray(source)) {
            return null;
        }
        const abilities = source
            .map((ability) => {
            const abilityId = this.ToNumber(ability?.abilityId ?? ability?.abilityID ?? ability?.id ?? ability?.itemId);
            const effectId = this.ToNumber(ability?.effectId ?? ability?.effectID ?? ability?.abilityEffectId ?? ability?.skillEffectId);
            if (abilityId === null || effectId === null) {
                return null;
            }
            const args = this.ToNumberArray(ability?.args ?? ability?.params ?? ability?.effectArgs ?? '');
            return {
                ...ability,
                abilityId,
                effectId,
                args,
                name: typeof ability?.name === 'string' ? ability.name : `ability_${abilityId}`,
                description: typeof ability?.description === 'string' ? ability.description : '',
            };
        })
            .filter((a) => a !== null);
        const base = (!Array.isArray(raw) && typeof raw === 'object') ? raw : {};
        return {
            ...base,
            abilities,
        };
    }
    /**
     * 获取地图怪物配置
     */
    static GetMapOgreConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.MAP_OGRES);
    }
    /**
     * 获取指定地图的配置
     * @param mapId 地图ID
     * @returns 地图配置，如果不存在返回 null
     */
    static GetMapConfigById(mapId) {
        const config = this.GetMapOgreConfig();
        if (!config) {
            return null;
        }
        return config.maps[mapId.toString()] || null;
    }
    /**
     * 获取精灵配置
     */
    static GetPetConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.PET_CONFIG);
    }
    /**
     * 获取指定精灵的配置
     * @param petId 精灵ID
     */
    static GetPetById(petId) {
        const config = this.GetPetConfig();
        if (!config || !config.Monsters) {
            return null;
        }
        const monsters = config.Monsters.Monster;
        if (!monsters) {
            return null;
        }
        // 处理单个或数组
        const monsterArray = Array.isArray(monsters) ? monsters : [monsters];
        return monsterArray.find(m => m.ID === petId) || null;
    }
    /**
     * 获取技能配置
     */
    static GetSkillConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.SKILL_CONFIG);
    }
    /**
     * 获取指定技能的配置
     * @param skillId 技能ID
     */
    static GetSkillById(skillId) {
        const config = this.GetSkillConfig();
        if (!config || !config.MovesTbl || !config.MovesTbl.Moves) {
            return null;
        }
        const moves = config.MovesTbl.Moves.Move;
        if (!moves) {
            return null;
        }
        // 处理单个或数组
        const moveArray = Array.isArray(moves) ? moves : [moves];
        return moveArray.find(m => m.ID === skillId) || null;
    }
    /**
     * 获取物品配置
     */
    static GetItemConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.ITEM_CONFIG);
    }
    /**
     * 获取指定物品的配置
     * @param itemId 物品ID
     */
    static GetItemById(itemId) {
        const config = this.GetItemConfig();
        if (!config || !config.Items) {
            return null;
        }
        const categories = config.Items.Cat;
        if (!categories) {
            return null;
        }
        // 处理单个或数组
        const catArray = Array.isArray(categories) ? categories : [categories];
        for (const cat of catArray) {
            if (!cat.Item)
                continue;
            const items = Array.isArray(cat.Item) ? cat.Item : [cat.Item];
            const item = items.find((i) => i.ID === itemId);
            if (item) {
                return item;
            }
        }
        return null;
    }
    /**
     * 获取技能效果配置
     */
    static GetSkillEffectsConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.SKILL_EFFECTS_CONFIG);
    }
    /**
     * 获取SPT配置
     */
    static GetSptConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.SPT_CONFIG);
    }
    /**
     * 获取性格配置
     */
    static GetNatureConfig() {
        const raw = ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.NATURES_CONFIG);
        if (!raw) {
            return null;
        }
        if (this._natureConfigSource === raw && this._natureConfigNormalized) {
            return this._natureConfigNormalized;
        }
        const normalized = this.NormalizeNatureConfig(raw);
        this._natureConfigSource = raw;
        this._natureConfigNormalized = normalized;
        if (!normalized) {
            utils_1.Logger.Warn('[GameConfig] Failed to normalize natures config, fallback to raw data');
            return raw;
        }
        return normalized;
    }
    /**
     * 获取属性配置
     */
    static GetElementConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.ELEMENTS_CONFIG);
    }
    /**
     * 获取唯一物品配置
     */
    static GetUniqueItemsConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.UNIQUE_ITEMS_CONFIG);
    }
    /**
     * 获取默认玩家配置
     */
    static GetDefaultPlayerConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.DEFAULT_PLAYER);
    }
    /**
     * 获取已实现的效果（从V2配置）
     * 注意：此方法已废弃，请使用 SkillEffectsConfig.Instance.GetImplementedEffects()
     */
    static GetImplementedEffects() {
        return SkillEffectsConfig_1.SkillEffectsConfig.Instance.GetImplementedEffects();
    }
    /**
     * 获取未实现的效果（从V2配置）
     */
    static GetUnimplementedEffects() {
        return SkillEffectsConfig_1.SkillEffectsConfig.Instance.GetUnimplementedEffects();
    }
    /**
     * 按分类获取效果（从V2配置）
     * @param category 效果分类
     */
    static GetEffectsByCategory(category) {
        return SkillEffectsConfig_1.SkillEffectsConfig.Instance.GetAllEffects().filter((e) => e.category === category);
    }
    // ============ 向后兼容的方法（已废弃，使用V2配置） ============
    /**
     * @deprecated 使用 GetEffectById 代替
     * 获取基础效果配置
     * @param eid 基础效果ID (1-41)
     */
    static GetBaseEffect(eid) {
        return this.GetEffectById(eid);
    }
    /**
     * @deprecated 使用 GetAllEffectsV2 代替
     * 获取所有基础效果
     */
    static GetAllBaseEffects() {
        const { SkillEffectsConfig } = require('./SkillEffectsConfig');
        return SkillEffectsConfig.Instance.GetAllEffects().filter((e) => e.effectId >= 1 && e.effectId <= 41);
    }
    /**
     * @deprecated 使用 GetEffectById 代替
     * 获取扩展效果配置
     * @param effectId 扩展效果ID (1-1901)
     */
    static GetExtendedEffect(effectId) {
        return this.GetEffectById(effectId);
    }
    /**
     * @deprecated 使用 GetAllEffectsV2 代替
     * 获取所有扩展效果
     */
    static GetAllExtendedEffects() {
        return this.GetAllEffectsV2();
    }
    /**
     * @deprecated 使用 GetImplementedEffects 代替
     * 获取已实现的扩展效果
     */
    static GetImplementedExtendedEffects() {
        return this.GetImplementedEffects();
    }
    /**
     * @deprecated 使用 GetUnimplementedEffects 代替
     * 获取未实现的扩展效果
     */
    static GetUnimplementedExtendedEffects() {
        return this.GetUnimplementedEffects();
    }
    /**
     * @deprecated 使用 GetEffectsByCategory 或自行过滤
     * 按映射类型获取扩展效果
     * @param mappingType 映射类型 ('new' | 'base' | 'ignore')
     */
    static GetExtendedEffectsByMappingType(mappingType) {
        const { SkillEffectsConfig } = require('./SkillEffectsConfig');
        return SkillEffectsConfig.Instance.GetAllEffects().filter((e) => e.mappingType === mappingType);
    }
    /**
     * 获取任务配置
     */
    static GetTaskConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.TASK_CONFIG);
    }
    /**
     * 获取指定任务的配置
     * @param taskId 任务ID
     */
    static GetTaskById(taskId) {
        const config = this.GetTaskConfig();
        if (!config || !config.tasks) {
            return null;
        }
        return config.tasks[taskId.toString()] || null;
    }
    /**
     * 重新加载地图怪物配置
     */
    static async ReloadMapOgres() {
        return await ConfigRegistry_1.ConfigRegistry.Instance.Reload(ConfigDefinitions_1.ConfigKeys.MAP_OGRES);
    }
    /**
     * 重新加载所有配置
     */
    static async ReloadAll() {
        await ConfigRegistry_1.ConfigRegistry.Instance.ReloadAll();
    }
    /**
     * 获取所有精灵配置
     */
    static GetAllPets() {
        const config = this.GetPetConfig();
        if (!config || !config.Monsters) {
            return [];
        }
        const monsters = config.Monsters.Monster;
        if (!monsters) {
            return [];
        }
        return Array.isArray(monsters) ? monsters : [monsters];
    }
    /**
     * 按属性类型获取精灵
     * @param type 属性类型
     */
    static GetPetsByType(type) {
        return this.GetAllPets().filter(p => p.Type === type);
    }
    /**
     * 获取精灵进化链
     * @param petId 精灵ID
     */
    static GetEvolutionChain(petId) {
        const chain = [];
        let current = this.GetPetById(petId);
        // 向前查找起始形态
        while (current && current.EvolvesFrom && current.EvolvesFrom > 0) {
            current = this.GetPetById(current.EvolvesFrom);
        }
        // 从起始形态向后遍历
        while (current) {
            chain.push(current);
            if (current.EvolvesTo && current.EvolvesTo > 0) {
                current = this.GetPetById(current.EvolvesTo);
            }
            else {
                break;
            }
        }
        return chain;
    }
    /**
     * 获取所有技能配置
     */
    static GetAllSkills() {
        const config = this.GetSkillConfig();
        if (!config || !config.MovesTbl || !config.MovesTbl.Moves) {
            return [];
        }
        const moves = config.MovesTbl.Moves.Move;
        if (!moves) {
            return [];
        }
        return Array.isArray(moves) ? moves : [moves];
    }
    /**
     * 按属性类型获取技能
     * @param type 属性类型
     */
    static GetSkillsByType(type) {
        return this.GetAllSkills().filter(s => s.Type === type);
    }
    /**
     * 按类别获取技能 (物理/特殊/状态)
     * @param category 类别 (1=物理, 2=特殊, 4=状态)
     */
    static GetSkillsByCategory(category) {
        return this.GetAllSkills().filter(s => s.Category === category);
    }
    /**
     * 获取所有物品配置
     */
    static GetAllItems() {
        const config = this.GetItemConfig();
        if (!config || !config.Items) {
            return [];
        }
        const categories = config.Items.Cat;
        if (!categories) {
            return [];
        }
        const catArray = Array.isArray(categories) ? categories : [categories];
        const allItems = [];
        for (const cat of catArray) {
            if (!cat.Item)
                continue;
            const items = Array.isArray(cat.Item) ? cat.Item : [cat.Item];
            allItems.push(...items);
        }
        return allItems;
    }
    /**
     * 按分类获取物品
     * @param catId 分类ID
     */
    static GetItemsByCategory(catId) {
        const config = this.GetItemConfig();
        if (!config || !config.Items) {
            return [];
        }
        const categories = config.Items.Cat;
        if (!categories) {
            return [];
        }
        const catArray = Array.isArray(categories) ? categories : [categories];
        const targetCat = catArray.find(c => c.ID === catId);
        if (!targetCat || !targetCat.Item) {
            return [];
        }
        return Array.isArray(targetCat.Item) ? targetCat.Item : [targetCat.Item];
    }
    /**
     * 获取物品分类配置
     * @param catId 分类ID
     */
    static GetItemCategory(catId) {
        const config = this.GetItemConfig();
        if (!config || !config.Items) {
            return null;
        }
        const categories = config.Items.Cat;
        if (!categories) {
            return null;
        }
        const catArray = Array.isArray(categories) ? categories : [categories];
        return catArray.find(c => c.ID === catId) || null;
    }
    /**
     * 获取所有物品分类
     */
    static GetAllItemCategories() {
        const config = this.GetItemConfig();
        if (!config || !config.Items) {
            return [];
        }
        const categories = config.Items.Cat;
        if (!categories) {
            return [];
        }
        return Array.isArray(categories) ? categories : [categories];
    }
    /**
     * 获取配置统计信息
     */
    static GetStats() {
        return ConfigRegistry_1.ConfigRegistry.Instance.GetStats();
    }
    /**
     * 获取技能效果V2配置（通过SkillEffectsConfig）
     * @param effectId 效果ID
     */
    static GetEffectById(effectId) {
        // 动态导入SkillEffectsConfig以避免循环依赖
        const { SkillEffectsConfig } = require('./SkillEffectsConfig');
        return SkillEffectsConfig.Instance.GetEffectById(effectId);
    }
    /**
     * 获取所有技能效果V2配置
     */
    static GetAllEffectsV2() {
        const { SkillEffectsConfig } = require('./SkillEffectsConfig');
        return SkillEffectsConfig.Instance.GetAllEffects();
    }
    /**
     * 重新加载技能效果V2配置
     */
    static async ReloadSkillEffectsV2() {
        const { SkillEffectsConfig } = require('./SkillEffectsConfig');
        await SkillEffectsConfig.Instance.Reload();
    }
    /**
     * 获取商品配置
     */
    static GetShopConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.SHOP_CONFIG);
    }
    /**
     * 获取精灵特性配置
     */
    static GetPetAbilitiesConfig() {
        const raw = ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.PET_ABILITIES);
        if (!raw) {
            return null;
        }
        if (this._petAbilitiesSource === raw && this._petAbilitiesNormalized) {
            return this._petAbilitiesNormalized;
        }
        const normalized = this.NormalizePetAbilitiesConfig(raw);
        this._petAbilitiesSource = raw;
        this._petAbilitiesNormalized = normalized;
        if (!normalized) {
            utils_1.Logger.Warn('[GameConfig] Failed to normalize pet_abilities config, fallback to raw data');
            return raw;
        }
        return normalized;
    }
    /**
     * 获取所有精灵可拥有的特性列表
     */
    static GetAllPetAbilities() {
        const config = this.GetPetAbilitiesConfig();
        if (!config || !Array.isArray(config.abilities)) {
            return [];
        }
        return config.abilities;
    }
    /**
     * 获取指定特性配置
     * @param abilityId 特性ID（客户端ID，如1006-1045）
     */
    static GetPetAbilityById(abilityId) {
        const abilities = this.GetAllPetAbilities();
        return abilities.find((a) => Number(a.abilityId) === Number(abilityId)) || null;
    }
    /**
     * 获取BOSS特性配置
     */
    static GetBossAbilitiesConfig() {
        return ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.BOSS_ABILITIES);
    }
    /**
     * 获取所有BOSS配置
     */
    static GetAllBosses() {
        const config = this.GetBossAbilitiesConfig();
        if (!config || !config.bossConfigs) {
            return [];
        }
        return config.bossConfigs;
    }
    /**
     * 根据地图ID和param2获取BOSS配置
     * @param mapId 地图ID
     * @param param2 参数2
     */
    static GetBossByMapAndParam(mapId, param2) {
        return BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2) || null;
    }
    /**
     * 根据petId获取BOSS配置
     * @param petId 精灵ID
     */
    static GetBossByPetId(petId) {
        return BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByPetId(petId) || null;
    }
    /**
     * 获取所有SPT BOSS配置
     */
    static GetAllSPTBosses() {
        return BossAbilityConfig_1.BossAbilityConfig.Instance.GetAllSPTBosses();
    }
    /**
     * 根据SPT任务ID获取BOSS配置
     * @param sptId SPT任务ID (1-20)
     */
    static GetBossBySPTId(sptId) {
        return BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossBySPTId(sptId) || null;
    }
    /**
     * 获取指定商品的配置
     * @param productId 商品ID
     */
    static GetProductById(productId) {
        const config = this.GetShopConfig();
        if (!config || !config.products) {
            return null;
        }
        return config.products.find((p) => p.productID === productId) || null;
    }
    /**
     * 获取所有商品配置
     */
    static GetAllProducts() {
        const config = this.GetShopConfig();
        if (!config || !config.products) {
            return [];
        }
        return config.products;
    }
}
exports.GameConfig = GameConfig;
//# sourceMappingURL=GameConfig.js.map