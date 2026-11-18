"use strict";
/**
 * 赛尔号属性克制系统
 * 26种属性，包含完整的克制关系和伤害倍率计算
 *
 * 移植自: luvit/luvit_version/game/seer_elements.lua
 *
 * 克制规则：
 * - 2.0 = 克制（效果拔群）
 * - 1.0 = 普通（效果一般）
 * - 0.5 = 被克制（效果不佳）
 * - 0.0 = 无效（完全无效）
 *
 * 数据来源：config/data/json/elements.json
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementSystem = exports.ElementType = void 0;
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const utils_1 = require("../../../shared/utils");
/**
 * 属性类型枚举
 */
var ElementType;
(function (ElementType) {
    ElementType[ElementType["GRASS"] = 1] = "GRASS";
    ElementType[ElementType["WATER"] = 2] = "WATER";
    ElementType[ElementType["FIRE"] = 3] = "FIRE";
    ElementType[ElementType["FLYING"] = 4] = "FLYING";
    ElementType[ElementType["ELECTRIC"] = 5] = "ELECTRIC";
    ElementType[ElementType["MACHINE"] = 6] = "MACHINE";
    ElementType[ElementType["GROUND"] = 7] = "GROUND";
    ElementType[ElementType["NORMAL"] = 8] = "NORMAL";
    ElementType[ElementType["ICE"] = 9] = "ICE";
    ElementType[ElementType["PSYCHIC"] = 10] = "PSYCHIC";
    ElementType[ElementType["FIGHTING"] = 11] = "FIGHTING";
    ElementType[ElementType["LIGHT"] = 12] = "LIGHT";
    ElementType[ElementType["DARK"] = 13] = "DARK";
    ElementType[ElementType["MYSTERY"] = 14] = "MYSTERY";
    ElementType[ElementType["DRAGON"] = 15] = "DRAGON";
    ElementType[ElementType["HOLY"] = 16] = "HOLY";
    ElementType[ElementType["DIMENSION"] = 17] = "DIMENSION";
    ElementType[ElementType["ANCIENT"] = 18] = "ANCIENT";
    ElementType[ElementType["EVIL"] = 19] = "EVIL";
    ElementType[ElementType["NATURE"] = 20] = "NATURE";
    ElementType[ElementType["KING"] = 21] = "KING";
    ElementType[ElementType["CHAOS"] = 22] = "CHAOS";
    ElementType[ElementType["DIVINE"] = 23] = "DIVINE";
    ElementType[ElementType["CYCLE"] = 24] = "CYCLE";
    ElementType[ElementType["BUG"] = 25] = "BUG";
    ElementType[ElementType["VOID"] = 26] = "VOID"; // 虚空
})(ElementType || (exports.ElementType = ElementType = {}));
/**
 * 属性克制系统类
 */
class ElementSystem {
    /**
     * 属性数据缓存
     */
    static typeDataCache = null;
    /**
     * 属性克制表缓存
     * effectiveness[攻击属性][防守属性] = 倍率
     */
    static effectivenessCache = null;
    /**
     * 加载属性数据
     */
    static LoadElementData() {
        if (this.typeDataCache && this.effectivenessCache) {
            return;
        }
        try {
            const config = GameConfig_1.GameConfig.GetElementConfig();
            if (!config || !config.types || !config.effectiveness) {
                utils_1.Logger.Warn('[ElementSystem] 属性配置未加载');
                this.typeDataCache = [];
                this.effectivenessCache = {};
                return;
            }
            // 加载属性类型数据
            this.typeDataCache = config.types;
            // 加载属性克制表
            this.effectivenessCache = {};
            // 初始化所有为1（普通效果）
            for (let i = 1; i <= 26; i++) {
                this.effectivenessCache[i] = {};
                for (let j = 1; j <= 26; j++) {
                    this.effectivenessCache[i][j] = 1.0;
                }
            }
            // 应用克制关系
            for (const atkTypeStr in config.effectiveness) {
                const atkType = parseInt(atkTypeStr);
                const relations = config.effectiveness[atkTypeStr];
                for (const defTypeStr in relations) {
                    const defType = parseInt(defTypeStr);
                    const multiplier = relations[defTypeStr];
                    this.effectivenessCache[atkType][defType] = multiplier;
                }
            }
        }
        catch (error) {
            utils_1.Logger.Error('[ElementSystem] 加载属性数据失败', error);
            // 初始化为空，避免崩溃
            this.typeDataCache = [];
            this.effectivenessCache = {};
        }
    }
    // ==================== 核心方法 ====================
    /**
     * 获取属性名称
     *
     * @param typeId 属性ID (1-26)
     * @returns 属性名称
     */
    static GetTypeName(typeId) {
        this.LoadElementData();
        const type = this.typeDataCache?.find(t => t.id === typeId);
        return type ? type.name : '未知';
    }
    /**
     * 获取属性英文名称
     *
     * @param typeId 属性ID (1-26)
     * @returns 属性英文名称
     */
    static GetTypeNameEn(typeId) {
        this.LoadElementData();
        const type = this.typeDataCache?.find(t => t.id === typeId);
        return type ? type.nameEn : 'UNKNOWN';
    }
    /**
     * 获取单属性对单属性的克制倍率
     *
     * @param atkType 攻击属性类型
     * @param defType 防守属性类型
     * @returns 克制倍率 (2.0=克制, 1.0=普通, 0.5=被克制, 0.0=无效)
     */
    static GetSingleEffectiveness(atkType, defType) {
        this.LoadElementData();
        if (!atkType || !defType) {
            return 1.0;
        }
        if (atkType < 1 || atkType > 26 || defType < 1 || defType > 26) {
            return 1.0;
        }
        return this.effectivenessCache?.[atkType]?.[defType] ?? 1.0;
    }

    /**
     * 属性的组成：双属性拆成两个单属性，客户端221–226（王、混沌、神灵、轮回、虫、虚空）对应克制表的21–26
     */
    static Components(typeId) {
        const config = GameConfig_1.GameConfig.GetElementConfig();
        const alias = config?.typeAliases?.[typeId];
        if (alias)
            return [alias];
        return config?.dualTypes?.[typeId] || [typeId];
    }

    /**
     * 克制倍率（单属性、双属性都适用，双属性按拆分公式）
     */
    static GetEffectiveness(atkType, defType) {
        if (!atkType || !defType)
            return 1.0;
        const [atk1, atk2] = this.Components(atkType);
        const [def1, def2] = this.Components(defType);
        return this.CalcDualVsDual(atk1, atk2, def1, def2);
    }
    /**
     * 单属性攻击双属性
     *
     * 规则：
     * - 将双属性防守方的属性拆分，各自计算单属性攻击方对两者的克制系数
     * - 若两者均为2，则最终克制系数为4
     * - 若其中一项为0，则最终克制系数为两者之和÷4
     * - 若为其他情况，则最终克制系数为两者之和÷2
     *
     * @param atkType 攻击属性
     * @param defType1 防守属性1
     * @param defType2 防守属性2
     * @returns 克制倍率
     */
    static CalcSingleVsDual(atkType, defType1, defType2) {
        // 如果没有第二属性或两个属性相同，按单属性计算
        if (!defType2 || defType1 === defType2) {
            return this.GetSingleEffectiveness(atkType, defType1);
        }
        const eff1 = this.GetSingleEffectiveness(atkType, defType1);
        const eff2 = this.GetSingleEffectiveness(atkType, defType2);
        // 两者均为克制
        if (eff1 === 2 && eff2 === 2) {
            return 4;
        }
        // 其中一项无效
        if (eff1 === 0 || eff2 === 0) {
            return (eff1 + eff2) / 4;
        }
        // 其他情况
        return (eff1 + eff2) / 2;
    }
    /**
     * 双属性攻击单属性
     *
     * 规则：
     * - 将双属性攻击方的属性拆分，各自计算两者对单属性防守方的克制系数
     * - 若两者均为2，则最终克制系数为4
     * - 若其中一项为0，则最终克制系数为两者之和÷4
     * - 若为其他情况，则最终克制系数为两者之和÷2
     *
     * @param atkType1 攻击属性1
     * @param atkType2 攻击属性2
     * @param defType 防守属性
     * @returns 克制倍率
     */
    static CalcDualVsSingle(atkType1, atkType2, defType) {
        // 如果没有第二属性或两个属性相同，按单属性计算
        if (!atkType2 || atkType1 === atkType2) {
            return this.GetSingleEffectiveness(atkType1, defType);
        }
        const eff1 = this.GetSingleEffectiveness(atkType1, defType);
        const eff2 = this.GetSingleEffectiveness(atkType2, defType);
        // 两者均为克制
        if (eff1 === 2 && eff2 === 2) {
            return 4;
        }
        // 其中一项无效
        if (eff1 === 0 || eff2 === 0) {
            return (eff1 + eff2) / 4;
        }
        // 其他情况
        return (eff1 + eff2) / 2;
    }
    /**
     * 双属性攻击双属性
     *
     * 规则：
     * - 将防守方的属性拆分，计算双属性攻击方对两者的克制系数，直接加总÷2
     *
     * @param atkType1 攻击属性1
     * @param atkType2 攻击属性2
     * @param defType1 防守属性1
     * @param defType2 防守属性2
     * @returns 克制倍率
     */
    static CalcDualVsDual(atkType1, atkType2, defType1, defType2) {
        // 如果攻击方是单属性
        if (!atkType2 || atkType1 === atkType2) {
            return this.CalcSingleVsDual(atkType1, defType1, defType2);
        }
        // 如果防守方是单属性
        if (!defType2 || defType1 === defType2) {
            return this.CalcDualVsSingle(atkType1, atkType2, defType1);
        }
        // 双属性攻击双属性：计算双属性攻击方对两个防守属性的克制系数，加总÷2
        const effVsDef1 = this.CalcDualVsSingle(atkType1, atkType2, defType1);
        const effVsDef2 = this.CalcDualVsSingle(atkType1, atkType2, defType2);
        return (effVsDef1 + effVsDef2) / 2;
    }
    /**
     * 通用计算函数（自动判断单/双属性）
     *
     * @param atkType1 攻击属性1
     * @param atkType2 攻击属性2（可选）
     * @param defType1 防守属性1
     * @param defType2 防守属性2（可选）
     * @returns 克制倍率
     */
    static CalculateEffectiveness(atkType1, atkType2, defType1, defType2) {
        return this.CalcDualVsDual(atkType1, atkType2, defType1, defType2);
    }
    // ==================== 本系加成 (STAB - Same Type Attack Bonus) ====================
    /**
     * 检查是否获得本系加成
     *
     * 单属性精灵使用与其属性一致的技能会获得50%的威力加成
     * 双属性精灵除了本系技能外，使用其属性拆分后的单属性技能亦能获得同等效果
     *
     * @param petType1 精灵属性1
     * @param petType2 精灵属性2（可选）
     * @param skillType1 技能属性1
     * @param skillType2 技能属性2（可选）
     * @returns 是否获得本系加成
     */
    static HasSTAB(petType1, petType2, skillType1, skillType2) {
        // 精灵属性列表
        const petTypes = [petType1];
        if (petType2 && petType2 !== petType1) {
            petTypes.push(petType2);
        }
        // 技能属性列表
        const skillTypes = [skillType1];
        if (skillType2 && skillType2 !== skillType1) {
            skillTypes.push(skillType2);
        }
        // 检查是否有任意匹配
        for (const pt of petTypes) {
            for (const st of skillTypes) {
                if (pt === st) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 本系：技能属性与精灵属性相同；双属性精灵使用其中一个属性的单属性技能也算
     */
    static IsSameType(petType, skillType) {
        if (!petType || !skillType)
            return false;
        if (petType === skillType)
            return true;
        const pet = this.Components(petType), skill = this.Components(skillType);
        return pet.length === 2 && skill.length === 1 && pet.includes(skill[0]);
    }
    /**
     * 获取STAB倍率
     *
     * @param petType1 精灵属性1
     * @param petType2 精灵属性2（可选）
     * @param skillType1 技能属性1
     * @param skillType2 技能属性2（可选）
     * @returns STAB倍率 (1.5或1.0)
     */
    static GetSTABMultiplier(petType1, petType2, skillType1, skillType2) {
        if (petType2 === undefined && skillType2 === undefined)
            return this.IsSameType(petType1, skillType1) ? 1.5 : 1.0;
        return this.HasSTAB(petType1, petType2, skillType1, skillType2) ? 1.5 : 1.0;
    }
    // ==================== 完整伤害倍率计算 ====================
    /**
     * 计算包含属性克制和本系加成的总倍率
     *
     * @param petType1 精灵属性1
     * @param petType2 精灵属性2（可选）
     * @param skillType1 技能属性1
     * @param skillType2 技能属性2（可选）
     * @param defType1 防守方属性1
     * @param defType2 防守方属性2（可选）
     * @returns 总伤害倍率
     */
    static CalculateDamageMultiplier(petType1, petType2, skillType1, skillType2, defType1, defType2) {
        // 属性克制倍率（使用技能属性攻击防守方属性）
        const effectiveness = this.CalculateEffectiveness(skillType1, skillType2, defType1, defType2);
        // 本系加成倍率
        const stab = this.GetSTABMultiplier(petType1, petType2, skillType1, skillType2);
        return effectiveness * stab;
    }
    // ==================== 辅助方法 ====================
    /**
     * 根据属性名获取属性ID
     *
     * @param name 属性名称
     * @returns 属性ID，如果未找到则返回undefined
     */
    static GetTypeByName(name) {
        this.LoadElementData();
        const type = this.typeDataCache?.find(t => t.name === name);
        return type?.id;
    }
    /**
     * 获取克制效果描述
     *
     * @param multiplier 克制倍率
     * @returns 效果描述文本
     */
    static GetEffectivenessText(multiplier) {
        if (multiplier >= 4) {
            return '超级克制';
        }
        else if (multiplier >= 2) {
            return '克制';
        }
        else if (multiplier >= 1) {
            return '普通';
        }
        else if (multiplier > 0) {
            return '微弱';
        }
        else {
            return '无效';
        }
    }
    /**
     * 获取所有属性类型
     *
     * @returns 所有属性类型数据
     */
    static GetAllTypes() {
        this.LoadElementData();
        return this.typeDataCache || [];
    }
    /**
     * 验证属性ID是否有效
     *
     * @param typeId 属性ID
     * @returns 是否有效
     */
    static IsValidType(typeId) {
        return typeId >= 1 && typeId <= 26;
    }
    // ==================== 调试方法 ====================
    /**
     * 打印属性克制信息（用于调试）
     *
     * @param atkType 攻击属性
     * @param defType 防守属性
     */
    static DebugEffectiveness(atkType, defType) {
        const eff = this.GetEffectiveness(atkType, defType);
        const atkName = this.GetTypeName(atkType);
        const defName = this.GetTypeName(defType);
        console.log(`[属性] ${atkName} → ${defName}: x${eff.toFixed(2)} (${this.GetEffectivenessText(eff)})`);
    }
    /**
     * 打印所有属性类型（用于调试）
     */
    static PrintAllTypes() {
        console.log('========== 赛尔号属性系统 ==========');
        const types = this.GetAllTypes();
        for (const type of types) {
            console.log(`[${type.id.toString().padStart(2, '0')}] ${type.name} (${type.nameEn})`);
        }
        console.log('====================================');
    }
}
exports.ElementSystem = ElementSystem;
//# sourceMappingURL=ElementSystem.js.map