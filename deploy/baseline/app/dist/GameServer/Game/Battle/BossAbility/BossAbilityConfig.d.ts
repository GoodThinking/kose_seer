/**
 * BOSS配置加载器
 *
 * 从 boss_abilities.json 读取BOSS完整配置
 * 包含：属性、等级、掉落、特性、特殊规则等
 *
 * 特性支持两种格式:
 *   纯数字: 1902 → 使用默认参数
 *   带参数: { "id": 1904, "args": [30] } → 覆盖默认参数
 *
 * SPT BOSS 扩展:
 *   支持地图BOSS查询、首次击败奖励、BOSS特性判断等
 *
 * 特殊规则:
 *   通过JSON配置驱动，避免硬编码
 */
/**
 * 单个特性条目（解析后）
 */
export interface IAbilityEntry {
    id: number;
    args?: number[];
}
/**
 * SPT BOSS 配置（先锋队任务）
 */
export interface ISPTBossInfo {
    sptId: number;
    rewardPetId?: number;
    rewardItemId?: number;
}
/**
 * 地图 BOSS 配置
 */
export interface IMapBossInfo {
    mapId: number;
    param2: number;
    bossId: number;
    hasShield?: boolean;
}
/**
 * 顺序破防规则（如哈莫雷特）
 */
export interface ISequentialTypeBreakRule {
    petId: number;
    petName: string;
    description: string;
    typeSequence: number[];
    typeNames: string[];
}
/**
 * 特殊击杀条件规则（如尤纳斯）
 */
export interface ISpecialKillConditionRule {
    petId: number;
    petName: string;
    description: string;
    breakSkillId: number;
    breakSkillName: string;
    killSkillId: number;
    killSkillName: string;
    requiredPetId: number;
    requiredPetName: string;
}
/**
 * 周几出现规则（如盖亚）
 */
export interface IWeekdayScheduleRule {
    petId: number;
    petName: string;
    description: string;
    schedule: Array<{
        weekdays: number[];
        mapId: number;
        mapName: string;
        condition: string;
        conditionValue?: number;
        conditionDesc: string;
    }>;
}
/**
 * 特殊规则配置
 */
export interface ISpecialRules {
    sequentialTypeBreak?: ISequentialTypeBreakRule[];
    specialKillCondition?: ISpecialKillConditionRule[];
    weekdaySchedule?: IWeekdayScheduleRule[];
}
/**
 * BOSS完整配置接口（JSON原始格式）
 */
export interface IBossConfig {
    mapId: number;
    param2: number;
    petId: number;
    petName: string;
    level: number;
    dv: number;
    ev: number;
    nature: number;
    customHP?: number;
    skills?: number[];
    abilities: (number | {
        id: number;
        args?: number[];
    })[];
    drops: Array<{
        itemId: number;
        rate: number;
        count: number;
    }>;
    rewards: {
        exp: number;
        coins: number;
    };
    description: string;
    spt?: ISPTBossInfo;
}
/**
 * BOSS配置类
 */
export declare class BossAbilityConfig {
    private static _instance;
    private abilityMap;
    private bossConfigMap;
    private petIdToConfigs;
    private sptIdToConfig;
    private loaded;
    private mapAlias;
    private specialRules;
    private sequentialTypeBreakIndex;
    private specialKillConditionIndex;
    private weekdayScheduleIndex;
    private constructor();
    static get Instance(): BossAbilityConfig;
    /**
     * 加载配置文件
     */
    Load(): void;
    /**
     * 根据地图ID和param2获取BOSS配置（主要查询方法）
     * 支持地图别名（如任务副本地图912 -> 正式地图40）
     *
     * @param mapId 地图ID
     * @param param2 参数2（区域/槽位）
     * @returns BOSS配置对象，如果不存在返回undefined
     */
    GetBossConfigByMapAndParam(mapId: number, param2: number): IBossConfig | undefined;
    /**
     * 根据petId获取BOSS配置列表（一个petId可能对应多个BOSS）
     * @param petId 精灵ID
     * @returns BOSS配置数组，如果不存在返回空数组
     */
    GetBossConfigsByPetId(petId: number): IBossConfig[];
    /**
     * 根据petId获取第一个BOSS配置（向后兼容）
     * @param petId 精灵ID
     * @returns BOSS配置对象，如果不存在返回undefined
     */
    GetBossConfigByPetId(petId: number): IBossConfig | undefined;
    /**
     * 获取精灵的特性条目列表（包含参数）
     *
     * @param petId 精灵ID
     * @returns 特性条目数组
     */
    GetAbilityEntries(petId: number): IAbilityEntry[];
    /**
     * 获取精灵的特性ID列表（向后兼容）
     *
     * @param petId 精灵ID
     * @returns 特性ID数组
     */
    GetAbilities(petId: number): number[];
    /**
     * 检查精灵是否有特性
     *
     * @param petId 精灵ID
     * @returns 是否有特性
     */
    HasAbilities(petId: number): boolean;
    /**
     * 检查BOSS是否存在
     *
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否存在
     */
    HasBoss(mapId: number, param2: number): boolean;
    /**
     * 重新加载配置
     */
    Reload(): void;
    /**
     * 根据SPT任务ID获取BOSS配置
     * @param sptId SPT任务ID (1-20)
     * @returns BOSS配置，如果不存在返回undefined
     */
    GetBossBySPTId(sptId: number): IBossConfig | undefined;
    /**
     * 获取所有SPT BOSS配置
     * @returns SPT BOSS配置数组，按sptId排序
     */
    GetAllSPTBosses(): IBossConfig[];
    /**
     * 检查BOSS是否为SPT BOSS
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否为SPT BOSS
     */
    IsSPTBoss(mapId: number, param2: number): boolean;
    /**
     * 检查BOSS是否有首次击败奖励
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否有首次击败奖励
     */
    HasFirstDefeatReward(mapId: number, param2: number): boolean;
    /**
     * 构建BOSS成就数据（200字节）
     * @param defeatedSPTBossIds 已击败的SPT BOSS petId列表
     * @returns 200字节的成就数据
     */
    BuildBossAchievement(defeatedSPTBossIds: number[]): Buffer;
    /**
     * 从成就数据中解析已击败的SPT BOSS petId列表
     * @param achievementData 200字节的成就数据
     * @returns 已击败的BOSS petId数组
     */
    ParseBossAchievement(achievementData: Buffer): number[];
    /**
     * 获取配置统计信息
     * @returns 统计信息对象
     */
    GetStats(): {
        totalBosses: number;
        sptBosses: number;
    };
    /**
     * 检查是否为顺序破防BOSS（如哈莫雷特）
     * @param petId 精灵ID
     * @returns 是否为顺序破防BOSS
     */
    IsSequentialTypeBreakBoss(petId: number): boolean;
    /**
     * 获取顺序破防BOSS当前阶段所需的属性类型
     * @param petId 精灵ID
     * @param phase 当前阶段（从0开始）
     * @returns 属性类型，如果不是顺序破防BOSS或配置不存在返回undefined
     */
    GetSequentialTypeBreakRequiredType(petId: number, phase: number): number | undefined;
    /**
     * 获取顺序破防规则配置
     * @param petId 精灵ID
     * @returns 顺序破防规则，如果不存在返回undefined
     */
    GetSequentialTypeBreakRule(petId: number): ISequentialTypeBreakRule | undefined;
    /**
     * 获取所有顺序破防规则
     * @returns 顺序破防规则数组
     */
    GetAllSequentialTypeBreakRules(): ISequentialTypeBreakRule[];
    /**
     * 检查是否为特殊击杀条件BOSS（如尤纳斯）
     * @param petId 精灵ID
     * @returns 是否为特殊击杀条件BOSS
     */
    IsSpecialKillConditionBoss(petId: number): boolean;
    /**
     * 获取特殊击杀条件规则配置
     * @param petId 精灵ID
     * @returns 特殊击杀条件规则，如果不存在返回undefined
     */
    GetSpecialKillConditionRule(petId: number): ISpecialKillConditionRule | undefined;
    /**
     * 获取所有特殊击杀条件规则
     * @returns 特殊击杀条件规则数组
     */
    GetAllSpecialKillConditionRules(): ISpecialKillConditionRule[];
    /**
     * 根据周几获取周几出现BOSS的地图ID和挑战条件
     * @param petId 精灵ID
     * @param weekday 周几（0=周日, 1=周一, ..., 6=周六）
     * @returns 地图ID和挑战条件，如果不存在返回undefined
     */
    GetWeekdayScheduleByWeekday(petId: number, weekday: number): {
        mapId: number;
        mapName: string;
        condition: string;
        conditionValue?: number;
        conditionDesc: string;
    } | undefined;
    /**
     * 检查是否为周几出现规则BOSS（如盖亚）
     * @param petId 精灵ID
     * @returns 是否为周几出现规则BOSS
     */
    IsWeekdayScheduleBoss(petId: number): boolean;
    /**
     * 获取周几出现规则配置
     * @param petId 精灵ID
     * @returns 周几出现规则，如果不存在返回undefined
     */
    GetWeekdayScheduleRule(petId: number): IWeekdayScheduleRule | undefined;
    /**
     * 获取所有周几出现规则
     * @returns 周几出现规则数组
     */
    GetAllWeekdayScheduleRules(): IWeekdayScheduleRule[];
    /**
     * 获取所有特殊规则配置
     * @returns 特殊规则对象
     */
    GetSpecialRules(): ISpecialRules;
}
//# sourceMappingURL=BossAbilityConfig.d.ts.map