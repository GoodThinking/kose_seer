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
/**
 * 属性类型枚举
 */
export declare enum ElementType {
    GRASS = 1,// 草
    WATER = 2,// 水
    FIRE = 3,// 火
    FLYING = 4,// 飞行
    ELECTRIC = 5,// 电
    MACHINE = 6,// 机械
    GROUND = 7,// 地面
    NORMAL = 8,// 普通
    ICE = 9,// 冰
    PSYCHIC = 10,// 超能
    FIGHTING = 11,// 战斗
    LIGHT = 12,// 光
    DARK = 13,// 暗影
    MYSTERY = 14,// 神秘
    DRAGON = 15,// 龙
    HOLY = 16,// 圣灵
    DIMENSION = 17,// 次元
    ANCIENT = 18,// 远古
    EVIL = 19,// 邪灵
    NATURE = 20,// 自然
    KING = 21,// 王
    CHAOS = 22,// 混沌
    DIVINE = 23,// 神灵
    CYCLE = 24,// 轮回
    BUG = 25,// 虫
    VOID = 26
}
/**
 * 属性数据接口
 */
export interface IElementType {
    id: number;
    name: string;
    nameEn: string;
}
/**
 * 属性克制系统类
 */
export declare class ElementSystem {
    /**
     * 属性数据缓存
     */
    private static typeDataCache;
    /**
     * 属性克制表缓存
     * effectiveness[攻击属性][防守属性] = 倍率
     */
    private static effectivenessCache;
    /**
     * 加载属性数据
     */
    private static LoadElementData;
    /**
     * 获取属性名称
     *
     * @param typeId 属性ID (1-26)
     * @returns 属性名称
     */
    static GetTypeName(typeId: number): string;
    /**
     * 获取属性英文名称
     *
     * @param typeId 属性ID (1-26)
     * @returns 属性英文名称
     */
    static GetTypeNameEn(typeId: number): string;
    /**
     * 获取单属性对单属性的克制倍率
     *
     * @param atkType 攻击属性类型
     * @param defType 防守属性类型
     * @returns 克制倍率 (2.0=克制, 1.0=普通, 0.5=被克制, 0.0=无效)
     */
    static GetEffectiveness(atkType: number, defType: number): number;
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
    static CalcSingleVsDual(atkType: number, defType1: number, defType2?: number): number;
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
    static CalcDualVsSingle(atkType1: number, atkType2: number | undefined, defType: number): number;
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
    static CalcDualVsDual(atkType1: number, atkType2: number | undefined, defType1: number, defType2: number | undefined): number;
    /**
     * 通用计算函数（自动判断单/双属性）
     *
     * @param atkType1 攻击属性1
     * @param atkType2 攻击属性2（可选）
     * @param defType1 防守属性1
     * @param defType2 防守属性2（可选）
     * @returns 克制倍率
     */
    static CalculateEffectiveness(atkType1: number, atkType2: number | undefined, defType1: number, defType2: number | undefined): number;
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
    static HasSTAB(petType1: number, petType2: number | undefined, skillType1: number, skillType2: number | undefined): boolean;
    /**
     * 获取STAB倍率
     *
     * @param petType1 精灵属性1
     * @param petType2 精灵属性2（可选）
     * @param skillType1 技能属性1
     * @param skillType2 技能属性2（可选）
     * @returns STAB倍率 (1.5或1.0)
     */
    static GetSTABMultiplier(petType1: number, petType2: number | undefined, skillType1: number, skillType2: number | undefined): number;
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
    static CalculateDamageMultiplier(petType1: number, petType2: number | undefined, skillType1: number, skillType2: number | undefined, defType1: number, defType2: number | undefined): number;
    /**
     * 根据属性名获取属性ID
     *
     * @param name 属性名称
     * @returns 属性ID，如果未找到则返回undefined
     */
    static GetTypeByName(name: string): number | undefined;
    /**
     * 获取克制效果描述
     *
     * @param multiplier 克制倍率
     * @returns 效果描述文本
     */
    static GetEffectivenessText(multiplier: number): string;
    /**
     * 获取所有属性类型
     *
     * @returns 所有属性类型数据
     */
    static GetAllTypes(): IElementType[];
    /**
     * 验证属性ID是否有效
     *
     * @param typeId 属性ID
     * @returns 是否有效
     */
    static IsValidType(typeId: number): boolean;
    /**
     * 打印属性克制信息（用于调试）
     *
     * @param atkType 攻击属性
     * @param defType 防守属性
     */
    static DebugEffectiveness(atkType: number, defType: number): void;
    /**
     * 打印所有属性类型（用于调试）
     */
    static PrintAllTypes(): void;
}
//# sourceMappingURL=ElementSystem.d.ts.map