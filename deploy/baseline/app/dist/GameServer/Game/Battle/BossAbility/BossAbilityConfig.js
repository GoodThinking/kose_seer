"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BossAbilityConfig = void 0;
const utils_1 = require("../../../../shared/utils");
const ConfigRegistry_1 = require("../../../../shared/config/ConfigRegistry");
const ConfigDefinitions_1 = require("../../../../shared/config/ConfigDefinitions");
/**
 * BOSS配置类
 */
class BossAbilityConfig {
    static _instance;
    abilityMap = new Map(); // petId -> abilities
    bossConfigMap = new Map(); // mapId -> (param2 -> config)
    petIdToConfigs = new Map(); // petId -> configs[] (用于快速查询)
    sptIdToConfig = new Map(); // sptId -> config (用于快速查询)
    loaded = false;
    // 从配置文件加载的数据
    mapAlias = new Map(); // 地图别名
    specialRules = {}; // 特殊规则
    // 特殊规则快速查询索引
    sequentialTypeBreakIndex = new Map(); // petId -> rule
    specialKillConditionIndex = new Map(); // petId -> rule
    weekdayScheduleIndex = new Map(); // petId -> rule
    constructor() { }
    static get Instance() {
        if (!BossAbilityConfig._instance) {
            BossAbilityConfig._instance = new BossAbilityConfig();
        }
        return BossAbilityConfig._instance;
    }
    /**
     * 加载配置文件
     */
    Load() {
        if (this.loaded) {
            return;
        }
        try {
            // 使用ConfigRegistry加载配置
            const config = ConfigRegistry_1.ConfigRegistry.Instance.Get(ConfigDefinitions_1.ConfigKeys.BOSS_ABILITIES);
            if (!config) {
                utils_1.Logger.Warn(`[BossAbilityConfig] 配置未加载或不存在: ${ConfigDefinitions_1.ConfigKeys.BOSS_ABILITIES}`);
                this.loaded = true;
                return;
            }
            // 加载地图别名
            this.mapAlias.clear();
            if (config.mapAlias) {
                for (const [key, value] of Object.entries(config.mapAlias)) {
                    this.mapAlias.set(parseInt(key), value);
                }
                utils_1.Logger.Info(`[BossAbilityConfig] 加载地图别名: ${this.mapAlias.size}个`);
            }
            // 加载特殊规则并构建索引
            this.sequentialTypeBreakIndex.clear();
            this.specialKillConditionIndex.clear();
            this.weekdayScheduleIndex.clear();
            if (config.specialRules) {
                this.specialRules = config.specialRules;
                // 构建顺序破防规则索引
                if (config.specialRules.sequentialTypeBreak) {
                    for (const rule of config.specialRules.sequentialTypeBreak) {
                        this.sequentialTypeBreakIndex.set(rule.petId, rule);
                    }
                }
                // 构建特殊击杀条件规则索引
                if (config.specialRules.specialKillCondition) {
                    for (const rule of config.specialRules.specialKillCondition) {
                        this.specialKillConditionIndex.set(rule.petId, rule);
                    }
                }
                // 构建周几出现规则索引
                if (config.specialRules.weekdaySchedule) {
                    for (const rule of config.specialRules.weekdaySchedule) {
                        this.weekdayScheduleIndex.set(rule.petId, rule);
                    }
                }
                const ruleCount = (config.specialRules.sequentialTypeBreak?.length || 0) +
                    (config.specialRules.specialKillCondition?.length || 0) +
                    (config.specialRules.weekdaySchedule?.length || 0);
                utils_1.Logger.Info(`[BossAbilityConfig] 加载特殊规则: ${ruleCount}个`);
            }
            // 构建映射表
            this.abilityMap.clear();
            this.bossConfigMap.clear();
            this.petIdToConfigs.clear();
            this.sptIdToConfig.clear();
            for (const boss of config.bossConfigs) {
                // 解析特性列表
                const entries = [];
                for (const ability of boss.abilities) {
                    if (typeof ability === 'number') {
                        entries.push({ id: ability });
                    }
                    else {
                        entries.push({ id: ability.id, args: ability.args });
                    }
                }
                // 存储特性映射（按petId索引，向后兼容）
                this.abilityMap.set(boss.petId, entries);
                // 构建二级索引：mapId -> (param2 -> config)
                if (!this.bossConfigMap.has(boss.mapId)) {
                    this.bossConfigMap.set(boss.mapId, new Map());
                }
                this.bossConfigMap.get(boss.mapId).set(boss.param2, boss);
                // 构建petId索引（一个petId可能对应多个BOSS配置）
                if (!this.petIdToConfigs.has(boss.petId)) {
                    this.petIdToConfigs.set(boss.petId, []);
                }
                this.petIdToConfigs.get(boss.petId).push(boss);
                // 构建SPT索引
                if (boss.spt && boss.spt.sptId > 0) {
                    this.sptIdToConfig.set(boss.spt.sptId, boss);
                }
            }
            utils_1.Logger.Info(`[BossAbilityConfig] 加载BOSS配置成功: ` +
                `版本=${config.version}, BOSS数=${config.bossConfigs.length}, ` +
                `地图数=${this.bossConfigMap.size}, 地图别名=${this.mapAlias.size}, ` +
                `特殊规则索引=${this.sequentialTypeBreakIndex.size + this.specialKillConditionIndex.size + this.weekdayScheduleIndex.size}`);
            this.loaded = true;
        }
        catch (error) {
            utils_1.Logger.Error('[BossAbilityConfig] 加载配置文件失败', error);
            this.loaded = true;
        }
    }
    /**
     * 根据地图ID和param2获取BOSS配置（主要查询方法）
     * 支持地图别名（如任务副本地图912 -> 正式地图40）
     *
     * @param mapId 地图ID
     * @param param2 参数2（区域/槽位）
     * @returns BOSS配置对象，如果不存在返回undefined
     */
    ListStandingBosses(mapId, now = new Date()) {
        if (!this.loaded)
            this.Load();
        const actualMapId = this.mapAlias.get(mapId) ?? mapId;
        const paramMap = this.bossConfigMap.get(actualMapId);
        if (!paramMap)
            return [];
        const weekday = now.getDay();
        const standing = [];
        for (const boss of paramMap.values()) {
            if (!boss.spt?.sptId || boss.spt.noStand)
                continue;
            if (this.IsWeekdayScheduleBoss(boss.petId)) {
                const today = this.GetWeekdayScheduleByWeekday(boss.petId, weekday);
                if (!today || today.mapId !== actualMapId)
                    continue;
            }
            standing.push(boss);
        }
        return standing;
    }
    GetBossConfigByMapAndParam(mapId, param2) {
        if (!this.loaded) {
            this.Load();
        }
        // 检查地图别名（如任务副本地图912 -> 正式地图40）
        const actualMapId = this.mapAlias.get(mapId) || mapId;
        // 查询BOSS配置
        const paramMap = this.bossConfigMap.get(actualMapId);
        if (!paramMap) {
            return undefined;
        }
        return paramMap.get(param2);
    }
    /**
     * 根据petId获取BOSS配置列表（一个petId可能对应多个BOSS）
     * @param petId 精灵ID
     * @returns BOSS配置数组，如果不存在返回空数组
     */
    GetBossConfigsByPetId(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.petIdToConfigs.get(petId) || [];
    }
    /**
     * 根据petId获取第一个BOSS配置（向后兼容）
     * @param petId 精灵ID
     * @returns BOSS配置对象，如果不存在返回undefined
     */
    GetBossConfigByPetId(petId) {
        const configs = this.GetBossConfigsByPetId(petId);
        return configs.length > 0 ? configs[0] : undefined;
    }
    /**
     * 获取精灵的特性条目列表（包含参数）
     *
     * @param petId 精灵ID
     * @returns 特性条目数组
     */
    GetAbilityEntries(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.abilityMap.get(petId) || [];
    }
    /**
     * 获取精灵的特性ID列表（向后兼容）
     *
     * @param petId 精灵ID
     * @returns 特性ID数组
     */
    GetAbilities(petId) {
        return this.GetAbilityEntries(petId).map(e => e.id);
    }
    /**
     * 检查精灵是否有特性
     *
     * @param petId 精灵ID
     * @returns 是否有特性
     */
    HasAbilities(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.abilityMap.has(petId);
    }
    /**
     * 检查BOSS是否存在
     *
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否存在
     */
    HasBoss(mapId, param2) {
        if (!this.loaded) {
            this.Load();
        }
        const actualMapId = this.mapAlias.get(mapId) || mapId;
        const paramMap = this.bossConfigMap.get(actualMapId);
        return paramMap !== undefined && paramMap.has(param2);
    }
    /**
     * 重新加载配置
     */
    Reload() {
        this.loaded = false;
        this.abilityMap.clear();
        this.bossConfigMap.clear();
        this.petIdToConfigs.clear();
        this.sptIdToConfig.clear();
        this.mapAlias.clear();
        this.specialRules = {};
        this.sequentialTypeBreakIndex.clear();
        this.specialKillConditionIndex.clear();
        this.weekdayScheduleIndex.clear();
        this.Load();
    }
    // ==================== SPT BOSS 扩展方法 ====================
    /**
     * 根据SPT任务ID获取BOSS配置
     * @param sptId SPT任务ID (1-20)
     * @returns BOSS配置，如果不存在返回undefined
     */
    GetBossBySPTId(sptId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.sptIdToConfig.get(sptId);
    }
    /**
     * 获取所有SPT BOSS配置
     * @returns SPT BOSS配置数组，按sptId排序
     */
    GetAllSPTBosses() {
        if (!this.loaded) {
            this.Load();
        }
        const sptBosses = [];
        for (const paramMap of this.bossConfigMap.values()) {
            for (const boss of paramMap.values()) {
                if (boss.spt && boss.spt.sptId > 0) {
                    sptBosses.push(boss);
                }
            }
        }
        // 按sptId排序
        sptBosses.sort((a, b) => (a.spt?.sptId || 0) - (b.spt?.sptId || 0));
        return sptBosses;
    }
    /**
     * 检查BOSS是否为SPT BOSS
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否为SPT BOSS
     */
    IsSPTBoss(mapId, param2) {
        const boss = this.GetBossConfigByMapAndParam(mapId, param2);
        return boss !== undefined && boss.spt !== undefined && boss.spt.sptId > 0;
    }
    /**
     * 检查BOSS是否有首次击败奖励
     * @param mapId 地图ID
     * @param param2 参数2
     * @returns 是否有首次击败奖励
     */
    HasFirstDefeatReward(mapId, param2) {
        const boss = this.GetBossConfigByMapAndParam(mapId, param2);
        if (!boss || !boss.spt) {
            return false;
        }
        return (boss.spt.rewardPetId !== undefined && boss.spt.rewardPetId > 0) ||
            (boss.spt.rewardItemId !== undefined && boss.spt.rewardItemId > 0);
    }
    /**
     * 构建BOSS成就数据（200字节）
     * @param defeatedSPTBossIds 已击败的SPT BOSS petId列表
     * @returns 200字节的成就数据
     */
    BuildBossAchievement(defeatedSPTBossIds) {
        if (!this.loaded) {
            this.Load();
        }
        const out = Buffer.alloc(200);
        const petIdToSPTIndex = new Map();
        // 构建 petId -> sptIndex 映射
        for (const paramMap of this.bossConfigMap.values()) {
            for (const boss of paramMap.values()) {
                if (boss.spt && boss.spt.sptId >= 1 && boss.spt.sptId <= 200) {
                    petIdToSPTIndex.set(boss.petId, boss.spt.sptId - 1);
                }
            }
        }
        // 标记已击败的BOSS
        for (const petId of defeatedSPTBossIds) {
            const idx = petIdToSPTIndex.get(petId);
            if (idx !== undefined && idx < 200) {
                out[idx] = 1;
            }
        }
        return out;
    }
    /**
     * 从成就数据中解析已击败的SPT BOSS petId列表
     * @param achievementData 200字节的成就数据
     * @returns 已击败的BOSS petId数组
     */
    ParseBossAchievement(achievementData) {
        if (!this.loaded) {
            this.Load();
        }
        const defeatedPetIds = [];
        const sptIndexToPetId = new Map();
        // 构建 sptIndex -> petId 映射
        for (const paramMap of this.bossConfigMap.values()) {
            for (const boss of paramMap.values()) {
                if (boss.spt && boss.spt.sptId >= 1 && boss.spt.sptId <= 200) {
                    sptIndexToPetId.set(boss.spt.sptId - 1, boss.petId);
                }
            }
        }
        // 解析成就数据
        for (let i = 0; i < Math.min(achievementData.length, 200); i++) {
            if (achievementData[i] === 1) {
                const petId = sptIndexToPetId.get(i);
                if (petId !== undefined) {
                    defeatedPetIds.push(petId);
                }
            }
        }
        return defeatedPetIds;
    }
    /**
     * 获取配置统计信息
     * @returns 统计信息对象
     */
    GetStats() {
        if (!this.loaded) {
            this.Load();
        }
        let totalBosses = 0;
        let sptBossCount = 0;
        for (const paramMap of this.bossConfigMap.values()) {
            for (const boss of paramMap.values()) {
                totalBosses++;
                if (boss.spt && boss.spt.sptId > 0) {
                    sptBossCount++;
                }
            }
        }
        return {
            totalBosses,
            sptBosses: sptBossCount,
        };
    }
    // ==================== 特殊BOSS规则 ====================
    /**
     * 检查是否为顺序破防BOSS（如哈莫雷特）
     * @param petId 精灵ID
     * @returns 是否为顺序破防BOSS
     */
    IsSequentialTypeBreakBoss(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.sequentialTypeBreakIndex.has(petId);
    }
    /**
     * 获取顺序破防BOSS当前阶段所需的属性类型
     * @param petId 精灵ID
     * @param phase 当前阶段（从0开始）
     * @returns 属性类型，如果不是顺序破防BOSS或配置不存在返回undefined
     */
    GetSequentialTypeBreakRequiredType(petId, phase) {
        if (!this.loaded) {
            this.Load();
        }
        const rule = this.sequentialTypeBreakIndex.get(petId);
        if (!rule || !rule.typeSequence || rule.typeSequence.length === 0) {
            return undefined;
        }
        const index = phase % rule.typeSequence.length;
        return rule.typeSequence[index];
    }
    /**
     * 获取顺序破防规则配置
     * @param petId 精灵ID
     * @returns 顺序破防规则，如果不存在返回undefined
     */
    GetSequentialTypeBreakRule(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.sequentialTypeBreakIndex.get(petId);
    }
    /**
     * 获取所有顺序破防规则
     * @returns 顺序破防规则数组
     */
    GetAllSequentialTypeBreakRules() {
        if (!this.loaded) {
            this.Load();
        }
        return this.specialRules.sequentialTypeBreak || [];
    }
    /**
     * 检查是否为特殊击杀条件BOSS（如尤纳斯）
     * @param petId 精灵ID
     * @returns 是否为特殊击杀条件BOSS
     */
    IsSpecialKillConditionBoss(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.specialKillConditionIndex.has(petId);
    }
    /**
     * 获取特殊击杀条件规则配置
     * @param petId 精灵ID
     * @returns 特殊击杀条件规则，如果不存在返回undefined
     */
    GetSpecialKillConditionRule(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.specialKillConditionIndex.get(petId);
    }
    /**
     * 获取所有特殊击杀条件规则
     * @returns 特殊击杀条件规则数组
     */
    GetAllSpecialKillConditionRules() {
        if (!this.loaded) {
            this.Load();
        }
        return this.specialRules.specialKillCondition || [];
    }
    /**
     * 根据周几获取周几出现BOSS的地图ID和挑战条件
     * @param petId 精灵ID
     * @param weekday 周几（0=周日, 1=周一, ..., 6=周六）
     * @returns 地图ID和挑战条件，如果不存在返回undefined
     */
    GetWeekdayScheduleByWeekday(petId, weekday) {
        if (!this.loaded) {
            this.Load();
        }
        const rule = this.weekdayScheduleIndex.get(petId);
        const entries = rule?.schedule || rule?.schedules;
        if (!entries) {
            return undefined;
        }
        for (const schedule of entries) {
            const days = schedule.weekdays.map(day => day === 7 ? 0 : day);
            if (days.includes(weekday)) {
                return {
                    mapId: schedule.mapId,
                    mapName: schedule.mapName,
                    condition: schedule.condition,
                    conditionValue: schedule.conditionValue,
                    conditionDesc: schedule.conditionDesc
                };
            }
        }
        return undefined;
    }
    /**
     * 检查是否为周几出现规则BOSS（如盖亚）
     * @param petId 精灵ID
     * @returns 是否为周几出现规则BOSS
     */
    IsWeekdayScheduleBoss(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.weekdayScheduleIndex.has(petId);
    }
    /**
     * 获取周几出现规则配置
     * @param petId 精灵ID
     * @returns 周几出现规则，如果不存在返回undefined
     */
    GetWeekdayScheduleRule(petId) {
        if (!this.loaded) {
            this.Load();
        }
        return this.weekdayScheduleIndex.get(petId);
    }
    /**
     * 获取所有周几出现规则
     * @returns 周几出现规则数组
     */
    GetAllWeekdayScheduleRules() {
        if (!this.loaded) {
            this.Load();
        }
        return this.specialRules.weekdaySchedule || [];
    }
    /**
     * 获取所有特殊规则配置
     * @returns 特殊规则对象
     */
    GetSpecialRules() {
        if (!this.loaded) {
            this.Load();
        }
        return this.specialRules;
    }
}
exports.BossAbilityConfig = BossAbilityConfig;
//# sourceMappingURL=BossAbilityConfig.js.map