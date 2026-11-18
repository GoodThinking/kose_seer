/**
 * 赛尔号性格系统
 * 26种性格，影响精灵属性成长
 *
 * 移植自: luvit/luvit_version/game/seer_natures.lua
 *
 * 性格规则：
 * - 增益属性：+10% (倍率 1.1)
 * - 减益属性：-10% (倍率 0.9)
 * - 平衡型：无属性变化 (倍率 1.0)
 * - 体力(HP)不受性格影响
 *
 * 数据来源：config/data/json/natures.json
 */
/**
 * 属性类型枚举
 */
export declare enum StatType {
    ATTACK = 1,// 攻击
    DEFENCE = 2,// 防御
    SP_ATTACK = 3,// 特攻
    SP_DEFENCE = 4,// 特防
    SPEED = 5
}
/**
 * 性格数据接口
 */
export interface INatureData {
    id: number;
    name: string;
    upStat?: StatType;
    downStat?: StatType;
    category: string;
}
/**
 * 属性修正值接口
 */
export interface IStatModifiers {
    attack: number;
    defence: number;
    spAttack: number;
    spDefence: number;
    speed: number;
}
/**
 * 精灵属性接口（用于应用性格修正）
 */
export interface IPetStats {
    hp: number;
    attack: number;
    defence: number;
    spAttack: number;
    spDefence: number;
    speed: number;
}
/**
 * 精灵定位类型（用于推荐性格）
 */
export declare enum PetRole {
    PHYSICAL = "physical",// 物理攻击手
    SPECIAL = "special",// 特殊攻击手
    TANK_DEF = "tank_def",// 物防肉盾
    TANK_SPDEF = "tank_spdef",// 特防肉盾
    SPEED = "speed",// 速度型
    BALANCED = "balanced"
}
/**
 * 性格系统类
 * 提供性格数据查询、属性修正计算等功能
 */
export declare class NatureSystem {
    /**
     * 属性名称映射
     */
    private static readonly STAT_NAMES;
    /**
     * 性格数据缓存
     */
    private static natureDataCache;
    /**
     * 加载性格数据
     */
    private static LoadNatureData;
    /**
     * 获取性格数据（内部使用）
     */
    private static get NATURE_DATA();
    private static GetAvailableNatureIds;
    /**
     * 推荐性格映射（根据精灵定位）
     */
    private static readonly RECOMMENDED_NATURES;
    /**
     * 获取性格数据
     *
     * @param natureId 性格ID (1-26)
     * @returns 性格数据，如果ID无效则返回undefined
     */
    static GetNature(natureId: number): INatureData | undefined;
    /**
     * 获取性格名称
     *
     * @param natureId 性格ID (1-26)
     * @returns 性格名称，如果ID无效则返回"未知"
     */
    static GetNatureName(natureId: number): string;
    /**
     * 获取性格对某属性的修正倍率
     *
     * @param natureId 性格ID (1-26)
     * @param statType 属性类型
     * @returns 修正倍率 (1.1=增益, 0.9=减益, 1.0=无变化)
     */
    static GetStatModifier(natureId: number, statType: StatType): number;
    /**
     * 获取性格的所有属性修正
     *
     * @param natureId 性格ID (1-26)
     * @returns 所有属性的修正倍率
     */
    static GetAllModifiers(natureId: number): IStatModifiers;
    /**
     * 应用性格修正到属性值
     *
     * 注意：体力(HP)不受性格影响
     *
     * @param natureId 性格ID (1-26)
     * @param stats 原始属性值
     * @returns 应用性格修正后的属性值
     */
    static ApplyNatureToStats(natureId: number, stats: IPetStats): IPetStats;
    /**
     * 获取性格描述
     *
     * @param natureId 性格ID (1-26)
     * @returns 性格描述文本
     *
     * @example
     * GetNatureDescription(1) // "孤独: 攻击+10%, 防御-10%"
     * GetNatureDescription(21) // "害羞: 平衡型（无属性变化）"
     */
    static GetNatureDescription(natureId: number): string;
    /**
     * 随机获取一个性格ID
     *
     * @returns 随机性格ID (1-26)
     */
    static GetRandomNature(): number;
    /**
     * 根据名称获取性格ID
     *
     * @param name 性格名称
     * @returns 性格ID，如果未找到则返回undefined
     */
    static GetNatureIdByName(name: string): number | undefined;
    /**
     * 获取推荐性格列表
     *
     * @param role 精灵定位类型
     * @returns 推荐的性格ID列表
     *
     * @example
     * GetRecommendedNatures(PetRole.PHYSICAL) // [3, 1, 2, 4] (固执、孤独、勇敢、调皮)
     */
    static GetRecommendedNatures(role: PetRole): number[];
    /**
     * 获取所有性格数据
     *
     * @returns 所有26种性格的数据数组
     */
    static GetAllNatures(): INatureData[];
    /**
     * 按类别获取性格列表
     *
     * @param category 性格类别
     * @returns 该类别的性格ID列表
     */
    static GetNaturesByCategory(category: string): number[];
    /**
     * 验证性格ID是否有效
     *
     * @param natureId 性格ID
     * @returns 是否有效
     */
    static IsValidNature(natureId: number): boolean;
    /**
     * 打印所有性格信息（用于调试）
     */
    static PrintAllNatures(): void;
    /**
     * 测试性格修正（用于调试）
     *
     * @param natureId 性格ID
     */
    static TestNature(natureId: number): void;
}
//# sourceMappingURL=NatureSystem.d.ts.map