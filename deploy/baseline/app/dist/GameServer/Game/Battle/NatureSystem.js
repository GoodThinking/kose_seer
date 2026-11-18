"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NatureSystem = exports.PetRole = exports.StatType = void 0;
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const utils_1 = require("../../../shared/utils");
/**
 * 属性类型枚举
 */
var StatType;
(function (StatType) {
    StatType[StatType["ATTACK"] = 1] = "ATTACK";
    StatType[StatType["DEFENCE"] = 2] = "DEFENCE";
    StatType[StatType["SP_ATTACK"] = 3] = "SP_ATTACK";
    StatType[StatType["SP_DEFENCE"] = 4] = "SP_DEFENCE";
    StatType[StatType["SPEED"] = 5] = "SPEED"; // 速度
})(StatType || (exports.StatType = StatType = {}));
/**
 * 精灵定位类型（用于推荐性格）
 */
var PetRole;
(function (PetRole) {
    PetRole["PHYSICAL"] = "physical";
    PetRole["SPECIAL"] = "special";
    PetRole["TANK_DEF"] = "tank_def";
    PetRole["TANK_SPDEF"] = "tank_spdef";
    PetRole["SPEED"] = "speed";
    PetRole["BALANCED"] = "balanced"; // 平衡型
})(PetRole || (exports.PetRole = PetRole = {}));
/**
 * 性格系统类
 * 提供性格数据查询、属性修正计算等功能
 */
class NatureSystem {
    /**
     * 属性名称映射
     */
    static STAT_NAMES = {
        [StatType.ATTACK]: '攻击',
        [StatType.DEFENCE]: '防御',
        [StatType.SP_ATTACK]: '特攻',
        [StatType.SP_DEFENCE]: '特防',
        [StatType.SPEED]: '速度'
    };
    /**
     * 性格数据缓存
     */
    static natureDataCache = null;
    /**
     * 加载性格数据
     */
    static LoadNatureData() {
        if (this.natureDataCache) {
            return this.natureDataCache;
        }
        try {
            const config = GameConfig_1.GameConfig.GetNatureConfig();
            if (!config || !config.natures) {
                utils_1.Logger.Warn('[NatureSystem] 性格配置未加载');
                return {};
            }
            const natureMap = {};
            const hasZeroBasedIds = config.natures.some((nature) => Number(nature.id) === 0) &&
                !config.natures.some((nature) => Number(nature.id) === 26);
            for (const nature of config.natures) {
                const rawId = Number(nature.id);
                if (!Number.isFinite(rawId)) {
                    continue;
                }
                const normalized = {
                    id: rawId,
                    name: nature.name,
                    upStat: nature.upStat,
                    downStat: nature.downStat,
                    category: nature.category
                };
                natureMap[rawId] = normalized;
                // Compatibility: mirror 0-based nature ids to 1-based ids.
                if (hasZeroBasedIds) {
                    const oneBasedId = rawId + 1;
                    if (natureMap[oneBasedId] === undefined) {
                        natureMap[oneBasedId] = { ...normalized, id: oneBasedId };
                    }
                }
            }
            this.natureDataCache = natureMap;
            return natureMap;
        }
        catch (error) {
            utils_1.Logger.Error('[NatureSystem] 加载性格数据失败', error);
            // 返回空对象，避免崩溃
            return {};
        }
    }
    /**
     * 获取性格数据（内部使用）
     */
    static get NATURE_DATA() {
        return this.LoadNatureData();
    }
    static GetAvailableNatureIds() {
        const ids = Object.keys(this.NATURE_DATA)
            .map(id => Number(id))
            .filter(id => Number.isFinite(id) && id > 0 && this.NATURE_DATA[id] !== undefined)
            .sort((a, b) => a - b);
        return ids;
    }
    /**
     * 推荐性格映射（根据精灵定位）
     */
    static RECOMMENDED_NATURES = {
        [PetRole.PHYSICAL]: [3, 1, 2, 4], // 固执、孤独、勇敢、调皮
        [PetRole.SPECIAL]: [15, 13, 14, 16], // 冷静、保守、稳重、马虎
        [PetRole.TANK_DEF]: [10, 9, 11, 12], // 悠闲、大胆、顽皮、无虑
        [PetRole.TANK_SPDEF]: [19, 17, 18, 20], // 狂妄、沉着、温顺、慎重
        [PetRole.SPEED]: [5, 6, 7, 8], // 胆小、急躁、开朗、天真
        [PetRole.BALANCED]: [21, 22, 23, 24, 25, 26] // 平衡型
    };
    // ==================== 核心方法 ====================
    /**
     * 获取性格数据
     *
     * @param natureId 性格ID (1-26)
     * @returns 性格数据，如果ID无效则返回undefined
     */
    static GetNature(natureId) {
        return this.NATURE_DATA[natureId];
    }
    /**
     * 获取性格名称
     *
     * @param natureId 性格ID (1-26)
     * @returns 性格名称，如果ID无效则返回"未知"
     */
    static GetNatureName(natureId) {
        const nature = this.NATURE_DATA[natureId];
        return nature ? nature.name : '未知';
    }
    /**
     * 获取性格对某属性的修正倍率
     *
     * @param natureId 性格ID (1-26)
     * @param statType 属性类型
     * @returns 修正倍率 (1.1=增益, 0.9=减益, 1.0=无变化)
     */
    static GetStatModifier(natureId, statType) {
        const nature = this.NATURE_DATA[natureId];
        if (!nature) {
            return 1.0;
        }
        // 增益属性 +10%
        if (nature.upStat === statType) {
            return 1.1;
        }
        // 减益属性 -10%
        if (nature.downStat === statType) {
            return 0.9;
        }
        // 无变化
        return 1.0;
    }
    /**
     * 获取性格的所有属性修正
     *
     * @param natureId 性格ID (1-26)
     * @returns 所有属性的修正倍率
     */
    static GetAllModifiers(natureId) {
        return {
            attack: this.GetStatModifier(natureId, StatType.ATTACK),
            defence: this.GetStatModifier(natureId, StatType.DEFENCE),
            spAttack: this.GetStatModifier(natureId, StatType.SP_ATTACK),
            spDefence: this.GetStatModifier(natureId, StatType.SP_DEFENCE),
            speed: this.GetStatModifier(natureId, StatType.SPEED)
        };
    }
    /**
     * 应用性格修正到属性值
     *
     * 注意：体力(HP)不受性格影响
     *
     * @param natureId 性格ID (1-26)
     * @param stats 原始属性值
     * @returns 应用性格修正后的属性值
     */
    static ApplyNatureToStats(natureId, stats) {
        const modifiers = this.GetAllModifiers(natureId);
        return {
            hp: stats.hp, // 体力不受性格影响
            attack: Math.floor(stats.attack * modifiers.attack),
            defence: Math.floor(stats.defence * modifiers.defence),
            spAttack: Math.floor(stats.spAttack * modifiers.spAttack),
            spDefence: Math.floor(stats.spDefence * modifiers.spDefence),
            speed: Math.floor(stats.speed * modifiers.speed)
        };
    }
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
    static GetNatureDescription(natureId) {
        const nature = this.NATURE_DATA[natureId];
        if (!nature) {
            return '未知性格';
        }
        // 平衡型性格
        if (!nature.upStat || !nature.downStat) {
            return `${nature.name}: 平衡型（无属性变化）`;
        }
        // 有增益/减益的性格
        const upStatName = this.STAT_NAMES[nature.upStat];
        const downStatName = this.STAT_NAMES[nature.downStat];
        return `${nature.name}: ${upStatName}+10%, ${downStatName}-10%`;
    }
    /**
     * 随机获取一个性格ID
     *
     * @returns 随机性格ID (1-26)
     */
    static GetRandomNature() {
        const natureIds = this.GetAvailableNatureIds();
        if (natureIds.length === 0) {
            return 1;
        }
        return natureIds[Math.floor(Math.random() * natureIds.length)];
    }
    /**
     * 根据名称获取性格ID
     *
     * @param name 性格名称
     * @returns 性格ID，如果未找到则返回undefined
     */
    static GetNatureIdByName(name) {
        for (const id of this.GetAvailableNatureIds()) {
            if (this.NATURE_DATA[id].name === name) {
                return id;
            }
        }
        return undefined;
    }
    /**
     * 获取推荐性格列表
     *
     * @param role 精灵定位类型
     * @returns 推荐的性格ID列表
     *
     * @example
     * GetRecommendedNatures(PetRole.PHYSICAL) // [3, 1, 2, 4] (固执、孤独、勇敢、调皮)
     */
    static GetRecommendedNatures(role) {
        return this.RECOMMENDED_NATURES[role] || this.RECOMMENDED_NATURES[PetRole.BALANCED];
    }
    /**
     * 获取所有性格数据
     *
     * @returns 所有26种性格的数据数组
     */
    static GetAllNatures() {
        const natures = [];
        for (const id of this.GetAvailableNatureIds()) {
            const nature = this.NATURE_DATA[id];
            if (nature) {
                natures.push(nature);
            }
        }
        return natures;
    }
    /**
     * 按类别获取性格列表
     *
     * @param category 性格类别
     * @returns 该类别的性格ID列表
     */
    static GetNaturesByCategory(category) {
        const natureIds = [];
        for (const id of this.GetAvailableNatureIds()) {
            if (this.NATURE_DATA[id].category === category) {
                natureIds.push(id);
            }
        }
        return natureIds;
    }
    /**
     * 验证性格ID是否有效
     *
     * @param natureId 性格ID
     * @returns 是否有效
     */
    static IsValidNature(natureId) {
        return natureId > 0 && this.NATURE_DATA[natureId] !== undefined;
    }
    // ==================== 调试和测试方法 ====================
    /**
     * 打印所有性格信息（用于调试）
     */
    static PrintAllNatures() {
        console.log('========== 赛尔号性格系统 ==========');
        for (let id = 1; id <= 26; id++) {
            console.log(`[${id.toString().padStart(2, '0')}] ${this.GetNatureDescription(id)}`);
        }
        console.log('====================================');
    }
    /**
     * 测试性格修正（用于调试）
     *
     * @param natureId 性格ID
     */
    static TestNature(natureId) {
        const testStats = {
            hp: 100,
            attack: 100,
            defence: 100,
            spAttack: 100,
            spDefence: 100,
            speed: 100
        };
        const result = this.ApplyNatureToStats(natureId, testStats);
        console.log(`[性格测试] ${this.GetNatureDescription(natureId)}`);
        console.log(`  基础: HP=${testStats.hp} ATK=${testStats.attack} DEF=${testStats.defence} SPA=${testStats.spAttack} SPD=${testStats.spDefence} SPE=${testStats.speed}`);
        console.log(`  修正: HP=${result.hp} ATK=${result.attack} DEF=${result.defence} SPA=${result.spAttack} SPD=${result.spDefence} SPE=${result.speed}`);
    }
}
exports.NatureSystem = NatureSystem;
//# sourceMappingURL=NatureSystem.js.map