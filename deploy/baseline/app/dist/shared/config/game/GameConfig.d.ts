import { IPetXmlConfig, IPetMonster, ISkillXmlConfig, ISkillMove, IItemXmlConfig, IItemCategory, IItem, ISkillEffectsXmlConfig, ISptXmlConfig } from '../../../shared/config/XmlConfigInterfaces';
import { IMapOgreConfig, INatureConfig, IElementConfig, IUniqueItemsConfig, IDefaultPlayerConfig } from './interfaces';
/**
 * 游戏配置管理器
 * 提供类型安全的配置访问接口
 */
export declare class GameConfig {
    private static _natureConfigSource;
    private static _natureConfigNormalized;
    private static _petAbilitiesSource;
    private static _petAbilitiesNormalized;
    private static ToNumber;
    private static ToNumberArray;
    private static NormalizeNatureConfig;
    private static NormalizePetAbilitiesConfig;
    /**
     * 获取地图怪物配置
     */
    static GetMapOgreConfig(): IMapOgreConfig | null;
    /**
     * 获取指定地图的配置
     * @param mapId 地图ID
     * @returns 地图配置，如果不存在返回 null
     */
    static GetMapConfigById(mapId: number): any;
    /**
     * 获取精灵配置
     */
    static GetPetConfig(): IPetXmlConfig | null;
    /**
     * 获取指定精灵的配置
     * @param petId 精灵ID
     */
    static GetPetById(petId: number): IPetMonster | null;
    /**
     * 获取技能配置
     */
    static GetSkillConfig(): ISkillXmlConfig | null;
    /**
     * 获取指定技能的配置
     * @param skillId 技能ID
     */
    static GetSkillById(skillId: number): ISkillMove | null;
    /**
     * 获取物品配置
     */
    static GetItemConfig(): IItemXmlConfig | null;
    /**
     * 获取指定物品的配置
     * @param itemId 物品ID
     */
    static GetItemById(itemId: number): IItem | null;
    /**
     * 获取技能效果配置
     */
    static GetSkillEffectsConfig(): ISkillEffectsXmlConfig | null;
    /**
     * 获取SPT配置
     */
    static GetSptConfig(): ISptXmlConfig | null;
    /**
     * 获取性格配置
     */
    static GetNatureConfig(): INatureConfig | null;
    /**
     * 获取属性配置
     */
    static GetElementConfig(): IElementConfig | null;
    /**
     * 获取唯一物品配置
     */
    static GetUniqueItemsConfig(): IUniqueItemsConfig | null;
    /**
     * 获取默认玩家配置
     */
    static GetDefaultPlayerConfig(): IDefaultPlayerConfig | null;
    /**
     * 获取已实现的效果（从V2配置）
     * 注意：此方法已废弃，请使用 SkillEffectsConfig.Instance.GetImplementedEffects()
     */
    static GetImplementedEffects(): any[];
    /**
     * 获取未实现的效果（从V2配置）
     */
    static GetUnimplementedEffects(): any[];
    /**
     * 按分类获取效果（从V2配置）
     * @param category 效果分类
     */
    static GetEffectsByCategory(category: string): any[];
    /**
     * @deprecated 使用 GetEffectById 代替
     * 获取基础效果配置
     * @param eid 基础效果ID (1-41)
     */
    static GetBaseEffect(eid: number): any | null;
    /**
     * @deprecated 使用 GetAllEffectsV2 代替
     * 获取所有基础效果
     */
    static GetAllBaseEffects(): any[];
    /**
     * @deprecated 使用 GetEffectById 代替
     * 获取扩展效果配置
     * @param effectId 扩展效果ID (1-1901)
     */
    static GetExtendedEffect(effectId: number): any | null;
    /**
     * @deprecated 使用 GetAllEffectsV2 代替
     * 获取所有扩展效果
     */
    static GetAllExtendedEffects(): any[];
    /**
     * @deprecated 使用 GetImplementedEffects 代替
     * 获取已实现的扩展效果
     */
    static GetImplementedExtendedEffects(): any[];
    /**
     * @deprecated 使用 GetUnimplementedEffects 代替
     * 获取未实现的扩展效果
     */
    static GetUnimplementedExtendedEffects(): any[];
    /**
     * @deprecated 使用 GetEffectsByCategory 或自行过滤
     * 按映射类型获取扩展效果
     * @param mappingType 映射类型 ('new' | 'base' | 'ignore')
     */
    static GetExtendedEffectsByMappingType(mappingType: string): any[];
    /**
     * 获取任务配置
     */
    static GetTaskConfig(): any | null;
    /**
     * 获取指定任务的配置
     * @param taskId 任务ID
     */
    static GetTaskById(taskId: number): any | null;
    /**
     * 重新加载地图怪物配置
     */
    static ReloadMapOgres(): Promise<boolean>;
    /**
     * 重新加载所有配置
     */
    static ReloadAll(): Promise<void>;
    /**
     * 获取所有精灵配置
     */
    static GetAllPets(): IPetMonster[];
    /**
     * 按属性类型获取精灵
     * @param type 属性类型
     */
    static GetPetsByType(type: number): IPetMonster[];
    /**
     * 获取精灵进化链
     * @param petId 精灵ID
     */
    static GetEvolutionChain(petId: number): IPetMonster[];
    /**
     * 获取所有技能配置
     */
    static GetAllSkills(): ISkillMove[];
    /**
     * 按属性类型获取技能
     * @param type 属性类型
     */
    static GetSkillsByType(type: number): ISkillMove[];
    /**
     * 按类别获取技能 (物理/特殊/状态)
     * @param category 类别 (1=物理, 2=特殊, 4=状态)
     */
    static GetSkillsByCategory(category: number): ISkillMove[];
    /**
     * 获取所有物品配置
     */
    static GetAllItems(): IItem[];
    /**
     * 按分类获取物品
     * @param catId 分类ID
     */
    static GetItemsByCategory(catId: number): IItem[];
    /**
     * 获取物品分类配置
     * @param catId 分类ID
     */
    static GetItemCategory(catId: number): IItemCategory | null;
    /**
     * 获取所有物品分类
     */
    static GetAllItemCategories(): IItemCategory[];
    /**
     * 获取配置统计信息
     */
    static GetStats(): {
        registered: number;
        loaded: number;
        initialized: boolean;
    };
    /**
     * 获取技能效果V2配置（通过SkillEffectsConfig）
     * @param effectId 效果ID
     */
    static GetEffectById(effectId: number): any | null;
    /**
     * 获取所有技能效果V2配置
     */
    static GetAllEffectsV2(): any[];
    /**
     * 重新加载技能效果V2配置
     */
    static ReloadSkillEffectsV2(): Promise<void>;
    /**
     * 获取商品配置
     */
    static GetShopConfig(): any | null;
    /**
     * 获取精灵特性配置
     */
    static GetPetAbilitiesConfig(): any | null;
    /**
     * 获取所有精灵可拥有的特性列表
     */
    static GetAllPetAbilities(): any[];
    /**
     * 获取指定特性配置
     * @param abilityId 特性ID（客户端ID，如1006-1045）
     */
    static GetPetAbilityById(abilityId: number): any | null;
    /**
     * 获取BOSS特性配置
     */
    static GetBossAbilitiesConfig(): any | null;
    /**
     * 获取所有BOSS配置
     */
    static GetAllBosses(): any[];
    /**
     * 根据地图ID和param2获取BOSS配置
     * @param mapId 地图ID
     * @param param2 参数2
     */
    static GetBossByMapAndParam(mapId: number, param2: number): any | null;
    /**
     * 根据petId获取BOSS配置
     * @param petId 精灵ID
     */
    static GetBossByPetId(petId: number): any | null;
    /**
     * 获取所有SPT BOSS配置
     */
    static GetAllSPTBosses(): any[];
    /**
     * 根据SPT任务ID获取BOSS配置
     * @param sptId SPT任务ID (1-20)
     */
    static GetBossBySPTId(sptId: number): any | null;
    /**
     * 获取指定商品的配置
     * @param productId 商品ID
     */
    static GetProductById(productId: number): any | null;
    /**
     * 获取所有商品配置
     */
    static GetAllProducts(): any[];
}
//# sourceMappingURL=GameConfig.d.ts.map